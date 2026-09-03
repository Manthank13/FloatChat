"""
LLM-assisted Natural Language Query Parser for FloatChat.

Converts oceanographic natural language user questions into validated
Pydantic StructuredQuery objects using an LLM reasoning engine backed by
strict deterministic normalization and domain validation.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from ai.config import AIConfig
from ai.llm_client import BaseLLMClient, MockLLMClient, create_llm_client
from ai.mappings.parser import BaseQueryParser, DeterministicQueryParser
from ai.models import (
    BoundingBox,
    ComparisonFilter,
    Coordinates,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from ai.prompts.system_prompts import QUERY_INTERPRETER_SYSTEM_PROMPT
from ai.prompts.templates import (
    FEW_SHOT_QUERY_PARSER_EXAMPLES,
    QUERY_PARSER_USER_TEMPLATE,
)
from ai.terminology import (
    DEPTH_LAYERS,
    KNOWN_OCEAN_LOCATIONS,
    PARAMETER_METADATA,
    PARAMETER_SYNONYMS,
)

logger = logging.getLogger(__name__)


class LLMQueryParser(BaseQueryParser):
    """
    LLM-assisted natural language query parser for oceanographic questions.
    
    Combines flexible LLM intent extraction with strict deterministic domain validation,
    controlled location normalization, and reliable fallbacks.
    """

    def __init__(
        self,
        llm_client: Optional[BaseLLMClient] = None,
        config: Optional[AIConfig] = None,
        fallback_parser: Optional[BaseQueryParser] = None,
    ):
        self.config = config or (llm_client.config if llm_client else AIConfig())
        self.llm_client = llm_client or create_llm_client(self.config)
        self.fallback_parser = fallback_parser or DeterministicQueryParser()

    def _build_prompt(self, query: str) -> str:
        """Construct prompt with few-shot examples and sanitized user query."""
        # Sanitize query to prevent prompt injection escaping quotes
        sanitized_query = query.replace('"', '\\"').strip()
        
        examples_str = ""
        for ex in FEW_SHOT_QUERY_PARSER_EXAMPLES:
            examples_str += f'User Query: "{ex["query"]}"\n'
            examples_str += f'JSON Response:\n{json.dumps(ex["expected_output"], indent=2)}\n\n'

        prompt = (
            f"Here are reference examples of converting user queries to StructuredQuery JSON:\n\n"
            f"{examples_str}"
            f"Now convert this user query:\n\n"
            f'User Query: "{sanitized_query}"\n'
            f"JSON Response:"
        )
        return prompt

    def _extract_json_payload(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON object from LLM response text."""
        cleaned = text.strip()

        # Handle markdown fences ```json ... ```
        if "```" in cleaned:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if match:
                cleaned = match.group(1).strip()

        # Try direct JSON parsing
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Try regex search for first balanced JSON object {...}
        brace_match = re.search(r"(\{[\s\S]*\})", cleaned)
        if brace_match:
            try:
                return json.loads(brace_match.group(1))
            except Exception:
                pass

        return None

    def parse(self, query: str) -> StructuredQuery:
        """
        Synchronously parse user query using LLM and deterministic validation.
        """
        cleaned_query = query.strip()
        prompt = self._build_prompt(cleaned_query)

        raw_llm_output = ""
        try:
            raw_llm_output = self.llm_client.generate(
                prompt=prompt,
                system_prompt=QUERY_INTERPRETER_SYSTEM_PROMPT,
            )
        except Exception as exc:
            logger.warning("LLM generation failed: %s. Falling back to deterministic parser.", exc)
            if self.config.fallback_to_deterministic:
                fallback_res = self.fallback_parser.parse(cleaned_query)
                fallback_res.validation_errors.append(f"LLM interpretation unavailable ({str(exc)}); processed via deterministic fallback.")
                return fallback_res
            else:
                return StructuredQuery(
                    raw_query=cleaned_query,
                    intent=QueryIntent.UNKNOWN,
                    is_valid=False,
                    confidence=0.0,
                    validation_errors=[f"LLM generation failed: {str(exc)}"],
                )

        parsed_json = self._extract_json_payload(raw_llm_output)
        if parsed_json is None:
            logger.warning("Failed to extract valid JSON from LLM output. Output was: %s", raw_llm_output)
            if self.config.fallback_to_deterministic:
                fallback_res = self.fallback_parser.parse(cleaned_query)
                fallback_res.validation_errors.append("LLM output was malformed JSON; processed via deterministic fallback.")
                return fallback_res
            else:
                return StructuredQuery(
                    raw_query=cleaned_query,
                    intent=QueryIntent.UNKNOWN,
                    is_valid=False,
                    confidence=0.0,
                    validation_errors=["Malformed JSON response from LLM interpretation layer."],
                )

        return self._normalize_and_validate(cleaned_query, parsed_json)

    async def parse_async(self, query: str) -> StructuredQuery:
        """
        Asynchronously parse user query using LLM and deterministic validation.
        """
        cleaned_query = query.strip()
        prompt = self._build_prompt(cleaned_query)

        raw_llm_output = ""
        try:
            raw_llm_output = await self.llm_client.generate_async(
                prompt=prompt,
                system_prompt=QUERY_INTERPRETER_SYSTEM_PROMPT,
            )
        except Exception as exc:
            logger.warning("Async LLM generation failed: %s. Falling back to deterministic parser.", exc)
            if self.config.fallback_to_deterministic:
                fallback_res = self.fallback_parser.parse(cleaned_query)
                fallback_res.validation_errors.append(f"LLM interpretation unavailable ({str(exc)}); processed via deterministic fallback.")
                return fallback_res
            else:
                return StructuredQuery(
                    raw_query=cleaned_query,
                    intent=QueryIntent.UNKNOWN,
                    is_valid=False,
                    confidence=0.0,
                    validation_errors=[f"LLM generation failed: {str(exc)}"],
                )

        parsed_json = self._extract_json_payload(raw_llm_output)
        if parsed_json is None:
            logger.warning("Failed to extract valid JSON from async LLM output.")
            if self.config.fallback_to_deterministic:
                fallback_res = self.fallback_parser.parse(cleaned_query)
                fallback_res.validation_errors.append("LLM output was malformed JSON; processed via deterministic fallback.")
                return fallback_res
            else:
                return StructuredQuery(
                    raw_query=cleaned_query,
                    intent=QueryIntent.UNKNOWN,
                    is_valid=False,
                    confidence=0.0,
                    validation_errors=["Malformed JSON response from LLM interpretation layer."],
                )

        return self._normalize_and_validate(cleaned_query, parsed_json)

    def _normalize_and_validate(self, raw_query: str, data: Dict[str, Any]) -> StructuredQuery:
        """
        Convert raw LLM JSON dictionary into a strictly validated StructuredQuery.
        """
        errors: List[str] = []

        # 1. Normalize Intent
        raw_intent = str(data.get("intent", "unknown")).lower()
        intent_map = {e.value: e for e in QueryIntent}
        intent = intent_map.get(raw_intent, QueryIntent.UNKNOWN)

        # 2. Normalize Parameters
        raw_params = data.get("parameters", [])
        parameters: List[OceanParameter] = []
        param_map = {p.value: p for p in OceanParameter}

        if isinstance(raw_params, list):
            for p in raw_params:
                p_str = str(p).strip().upper()
                if p_str in param_map:
                    parameters.append(param_map[p_str])
                else:
                    # Check synonym dictionary
                    lower_p = str(p).strip().lower()
                    if lower_p in PARAMETER_SYNONYMS:
                        parameters.append(PARAMETER_SYNONYMS[lower_p])
                    else:
                        errors.append(f"Unrecognized oceanographic parameter '{p}'.")

        # 3. Normalize Location
        location_filter: Optional[LocationFilter] = None
        raw_loc = data.get("location")
        if isinstance(raw_loc, dict):
            loc_name = raw_loc.get("name")
            loc_lat = raw_loc.get("latitude")
            loc_lon = raw_loc.get("longitude")
            raw_bbox = raw_loc.get("bounding_box")

            bbox: Optional[BoundingBox] = None
            if isinstance(raw_bbox, (list, tuple)) and len(raw_bbox) == 4:
                try:
                    bbox = BoundingBox(
                        min_latitude=float(raw_bbox[0]),
                        min_longitude=float(raw_bbox[1]),
                        max_latitude=float(raw_bbox[2]),
                        max_longitude=float(raw_bbox[3]),
                    )
                except Exception:
                    errors.append(f"Invalid bounding box coordinates: {raw_bbox}")

            # Check known location normalization
            if loc_name and loc_name.lower() in KNOWN_OCEAN_LOCATIONS:
                known = KNOWN_OCEAN_LOCATIONS[loc_name.lower()]
                normalized_name = known["name"]
                normalized_lat = known.get("latitude")
                normalized_lon = known.get("longitude")
                if "bounding_box" in known and not bbox:
                    b = known["bounding_box"]
                    bbox = BoundingBox(
                        min_latitude=b[0], min_longitude=b[1], max_latitude=b[2], max_longitude=b[3]
                    )

                location_filter = LocationFilter(
                    name=normalized_name,
                    latitude=normalized_lat,
                    longitude=normalized_lon,
                    bounding_box=bbox,
                    radius_km=raw_loc.get("radius_km") or known.get("default_radius_km", 50.0),
                )
            elif loc_name:
                # Location mentioned but not in controlled dictionary
                if loc_lat is None or loc_lon is None:
                    # Do NOT invent coordinates
                    errors.append(
                        f"Unresolved location '{loc_name}'. Coordinates or a supported oceanographic region are required."
                    )
                    location_filter = LocationFilter(
                        name=loc_name,
                        latitude=None,
                        longitude=None,
                        bounding_box=bbox,
                    )
                else:
                    try:
                        location_filter = LocationFilter(
                            name=loc_name,
                            latitude=float(loc_lat),
                            longitude=float(loc_lon),
                            bounding_box=bbox,
                        )
                    except Exception:
                        errors.append(f"Invalid coordinate values for location '{loc_name}'.")

        # 4. Normalize Radius
        radius_km: Optional[float] = None
        raw_radius = data.get("radius_km")
        if raw_radius is not None:
            try:
                radius_km = float(raw_radius)
                if radius_km <= 0:
                    errors.append(f"Search radius {radius_km}km must be positive.")
            except (ValueError, TypeError):
                errors.append(f"Invalid radius value: {raw_radius}")
        elif location_filter and location_filter.radius_km:
            radius_km = location_filter.radius_km

        # 5. Normalize Depth
        depth_filter: Optional[DepthFilter] = None
        raw_depth = data.get("depth")
        if isinstance(raw_depth, dict):
            try:
                d_min = float(raw_depth["depth_min"]) if raw_depth.get("depth_min") is not None else None
                d_max = float(raw_depth["depth_max"]) if raw_depth.get("depth_max") is not None else None
                t_depth = float(raw_depth["target_depth"]) if raw_depth.get("target_depth") is not None else None

                # Normalize single depth
                if t_depth is not None and d_min is None and d_max is None:
                    d_min = t_depth
                    d_max = t_depth
                elif d_min is not None and d_max is not None and d_min == d_max and t_depth is None:
                    t_depth = d_min

                if d_min is not None and d_min < 0:
                    errors.append(f"Depth min {d_min} cannot be negative.")
                if d_max is not None and d_max > 6000:
                    errors.append(f"Depth max {d_max} exceeds maximum ARGO depth (6000m).")
                if d_min is not None and d_max is not None and d_min > d_max:
                    errors.append(f"Depth min ({d_min}) cannot exceed depth max ({d_max}).")

                depth_filter = DepthFilter(
                    depth_min=d_min,
                    depth_max=d_max,
                    target_depth=t_depth,
                    unit=raw_depth.get("unit", "meters"),
                )
            except (ValueError, TypeError) as exc:
                errors.append(f"Invalid depth format: {exc}")

        # Top-level depth_min / depth_max convenience fields
        depth_min = depth_filter.depth_min if depth_filter else None
        depth_max = depth_filter.depth_max if depth_filter else None

        # 6. Normalize Time Range
        time_range: Optional[TimeRangeFilter] = None
        raw_time = data.get("time_range")
        if isinstance(raw_time, dict):
            try:
                time_range = TimeRangeFilter(
                    start_date=raw_time.get("start_date"),
                    end_date=raw_time.get("end_date"),
                    year=int(raw_time["year"]) if raw_time.get("year") is not None else None,
                    month=int(raw_time["month"]) if raw_time.get("month") is not None else None,
                    season=raw_time.get("season"),
                    relative_days=int(raw_time["relative_days"]) if raw_time.get("relative_days") is not None else None,
                    description=raw_time.get("description"),
                )
            except (ValueError, TypeError) as exc:
                errors.append(f"Invalid time_range values: {exc}")

        # 7. Normalize Platform ID
        platform_id: Optional[str] = None
        raw_platform = data.get("platform_id")
        if raw_platform:
            p_str = str(raw_platform).strip()
            # Clean non-digit characters if prefixed like "float 2903334"
            digits_only = "".join(c for c in p_str if c.isdigit())
            if len(digits_only) == 7:
                platform_id = digits_only
            elif digits_only:
                platform_id = digits_only
                errors.append(f"ARGO Float WMO identifier '{p_str}' is not a standard 7-digit number.")
            else:
                platform_id = p_str
                errors.append(f"Invalid ARGO Float platform identifier '{p_str}'.")

        # 8. Normalize Comparison
        comparison_filter: Optional[ComparisonFilter] = None
        raw_comp = data.get("comparison")
        if isinstance(raw_comp, dict):
            try:
                c_type = raw_comp.get("comparison_type", "location")
                t_a = raw_comp.get("target_a")
                t_b = raw_comp.get("target_b")

                depth_a = None
                depth_b = None
                if c_type == "depth" and t_a and t_b:
                    num_a = "".join(c for c in str(t_a) if c.isdigit() or c == ".")
                    num_b = "".join(c for c in str(t_b) if c.isdigit() or c == ".")
                    if num_a and num_b:
                        da = float(num_a)
                        db = float(num_b)
                        depth_a = DepthFilter(depth_min=da, depth_max=da, target_depth=da)
                        depth_b = DepthFilter(depth_min=db, depth_max=db, target_depth=db)

                comparison_filter = ComparisonFilter(
                    comparison_type=c_type,
                    target_a=t_a,
                    target_b=t_b,
                    depth_a=depth_a,
                    depth_b=depth_b,
                )
            except Exception as exc:
                errors.append(f"Invalid comparison structure: {exc}")

        # 9. Handle Ambiguous or Incomplete queries (e.g. "show me ocean data")
        if intent == QueryIntent.GENERAL_QUERY:
            errors = []
        elif intent == QueryIntent.UNKNOWN or (
            not parameters
            and not platform_id
            and not location_filter
            and not depth_filter
            and not time_range
        ):
            intent = QueryIntent.UNKNOWN
            errors.append("Ambiguous or incomplete query: missing parameter, location, or platform identifier.")

        # 10. Compute Confidence & Validity
        confidence = float(data.get("confidence", 0.9))
        is_valid = len(errors) == 0

        if not is_valid:
            confidence = min(confidence, 0.2)

        return StructuredQuery(
            raw_query=raw_query,
            intent=intent,
            parameters=parameters,
            location=location_filter,
            radius_km=radius_km,
            depth=depth_filter,
            depth_min=depth_min,
            depth_max=depth_max,
            time_range=time_range,
            platform_id=platform_id,
            comparison=comparison_filter,
            confidence=round(confidence, 2),
            is_valid=is_valid,
            validation_errors=errors,
        )
