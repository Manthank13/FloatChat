"""
LLM Client abstraction and provider implementations for FloatChat.

Supports OpenAI GPT (e.g. gpt-4o, gpt-4o-mini), Google Gemini,
and Deterministic Mock implementations for offline testing.
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


class OpenAILLMClient(BaseLLMClient):
    """
    OpenAI GPT client integration supporting GPT-4o, GPT-4o-mini, and compatible models.
    
    Reads API key dynamically from environment without logging or exposing secrets.
    Falls back to robust standard HTTP if openai package is not installed.
    """

    def __init__(self, config: Optional[AIConfig] = None):
        super().__init__(config=config or AIConfig(llm_provider="openai", model_name="gpt-4o-mini"))
        self.api_key = self.config.get_api_key()

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate response from OpenAI Chat Completions API."""
        if not self.api_key:
            raise ValueError(
                "Missing OpenAI API key. Please set the 'OPENAI_API_KEY' environment variable."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Try using openai SDK if available
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key, timeout=self.config.timeout_seconds)
            response = client.chat.completions.create(
                model=self.config.model_name,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
                response_format={"type": "json_object"} if "json" in (system_prompt or "").lower() else None,
            )
            return response.choices[0].message.content or "{}"
        except ImportError:
            # Standard library HTTP fallback
            import urllib.error
            import urllib.request

            url = "https://api.openai.com/v1/chat/completions"
            payload: Dict[str, Any] = {
                "model": self.config.model_name,
                "messages": messages,
                "temperature": self.config.temperature,
                "max_tokens": self.config.max_tokens,
            }
            if "json" in (system_prompt or "").lower():
                payload["response_format"] = {"type": "json_object"}

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )

            try:
                with urllib.request.urlopen(req, timeout=self.config.timeout_seconds) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    choices = resp_data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "{}")
                    return "{}"
            except Exception as exc:
                logger.error("Error communicating with OpenAI API: %s", exc)
                raise


class GeminiLLMClient(BaseLLMClient):
    """
    Google Gemini API client integration using google-genai or direct REST endpoints.
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
            import urllib.error
            import urllib.request

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

    if provider == "openai":
        return OpenAILLMClient(config=cfg)
    elif provider == "gemini":
        return GeminiLLMClient(config=cfg)
    elif provider == "mock":
        return MockLLMClient(config=cfg)
    else:
        logger.warning("Unrecognized LLM provider '%s', defaulting to MockLLMClient", provider)
        return MockLLMClient(config=cfg)
