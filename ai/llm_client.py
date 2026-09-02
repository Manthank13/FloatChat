"""
LLM Client abstraction and provider implementations for FloatChat.

Allows seamless switching between Mock (offline testing), Google Gemini,
OpenAI, or other LLM providers without altering the query parser interfaces.
"""

import abc
import json
import logging
from typing import Any, Callable, Dict, List, Optional, Union

from ai.config import AIConfig

logger = logging.getLogger(__name__)


class BaseLLMClient(abc.ABC):
    """Abstract Base Class for FloatChat LLM provider wrappers."""

    def __init__(self, config: Optional[AIConfig] = None):
        self.config = config or AIConfig()

    @abc.abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Synchronously send prompt to LLM and return raw text response."""
        pass

    async def generate_async(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Asynchronously send prompt to LLM. Defaults to synchronous generate."""
        return self.generate(prompt, system_prompt)


class MockLLMClient(BaseLLMClient):
    """
    Deterministic Mock LLM Client for unit testing and offline development.
    
    Can return programmed JSON payloads, execute response handlers,
    or simulate latency, network errors, and malformed responses.
    """

    def __init__(
        self,
        config: Optional[AIConfig] = None,
        default_response: Optional[Union[str, Dict[str, Any]]] = None,
        response_map: Optional[Dict[str, Union[str, Dict[str, Any]]]] = None,
        custom_handler: Optional[Callable[[str, Optional[str]], str]] = None,
        raise_error: Optional[Exception] = None,
    ):
        super().__init__(config=config or AIConfig(llm_provider="mock"))
        self.default_response = (
            json.dumps(default_response) if isinstance(default_response, dict) else (default_response or "{}")
        )
        self.response_map: Dict[str, str] = {
            k: (json.dumps(v) if isinstance(v, dict) else v)
            for k, v in (response_map or {}).items()
        }
        self.custom_handler = custom_handler
        self.raise_error = raise_error
        self.call_history: List[Dict[str, Any]] = []

    def set_response_for_query(self, query: str, response: Union[str, Dict[str, Any]]) -> None:
        """Register a specific mock response for a query substring."""
        self.response_map[query.lower()] = (
            json.dumps(response) if isinstance(response, dict) else response
        )

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Return programmed mock response or execute custom handler."""
        self.call_history.append({"prompt": prompt, "system_prompt": system_prompt})

        if self.raise_error is not None:
            raise self.raise_error

        if self.custom_handler is not None:
            return self.custom_handler(prompt, system_prompt)

        # Focus match on the actual user query section of the prompt if present
        target_section = prompt
        if "Now convert this user query:" in prompt:
            target_section = prompt.split("Now convert this user query:")[-1]

        lower_target = target_section.lower()
        for key, resp in self.response_map.items():
            if key in lower_target:
                return resp

        # Fallback to searching full prompt
        lower_prompt = prompt.lower()
        for key, resp in self.response_map.items():
            if key in lower_prompt:
                return resp

        return self.default_response


class GeminiLLMClient(BaseLLMClient):
    """
    Google Gemini API client integration using google-genai or direct REST endpoints.
    
    Adheres strictly to credential security guidelines: reads API key only from
    the environment without hardcoding or logging credentials.
    """

    def __init__(self, config: Optional[AIConfig] = None):
        super().__init__(config=config or AIConfig(llm_provider="gemini"))
        self.api_key = self.config.get_api_key()

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate response from Gemini API."""
        if not self.api_key:
            raise ValueError(
                f"Missing API key for Gemini. Please set the '{self.config.api_key_env_var}' environment variable."
            )

        # Lazy import to avoid unnecessary dependency crashes if SDK is not yet installed
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=self.config.model_name,
                contents=prompt,
                config={
                    "system_instruction": system_prompt,
                    "temperature": self.config.temperature,
                    "response_mime_type": "application/json",
                },
            )
            return response.text or "{}"
        except ImportError:
            # Fallback to direct HTTP request using urllib if SDK package is not installed
            import urllib.request
            import urllib.error

            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.config.model_name}:generateContent?key={self.api_key}"
            )
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": self.config.temperature,
                    "responseMimeType": "application/json",
                },
            }
            if system_prompt:
                payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            try:
                with urllib.request.urlopen(req, timeout=self.config.timeout_seconds) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    candidates = resp_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "{}")
                    return "{}"
            except Exception as exc:
                logger.error("Error communicating with Gemini API: %s", exc)
                raise


def create_llm_client(config: Optional[AIConfig] = None) -> BaseLLMClient:
    """Factory helper to instantiate the configured LLM client."""
    cfg = config or AIConfig()
    provider = cfg.llm_provider.lower()

    if provider == "gemini":
        return GeminiLLMClient(config=cfg)
    elif provider == "mock":
        return MockLLMClient(config=cfg)
    else:
        logger.warning("Unrecognized LLM provider '%s', defaulting to MockLLMClient", provider)
        return MockLLMClient(config=cfg)
