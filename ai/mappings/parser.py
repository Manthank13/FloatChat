"""
Query parser implementation converting natural-language oceanographic questions
into validated Pydantic StructuredQuery objects.

Includes an extensible BaseQueryParser interface and a high-performance
DeterministicQueryParser with regex and oceanographic domain heuristics.
"""

import abc
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from ai.models import (
    BoundingBox,
    ComparisonFilter,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
    TimeRangeFilter,
)
from ai.terminology import (
    DEPTH_LAYERS,
    KNOWN_OCEAN_LOCATIONS,
    PARAMETER_METADATA,
    PARAMETER_SYNONYMS,
    SEASON_MAPPINGS,
)


class BaseQueryParser(abc.ABC):
    """Abstract base class for all FloatChat natural-language query parsers."""

    @abc.abstractmethod
    def parse(self, query: str) -> StructuredQuery:
        """Synchronously parse natural language text into a StructuredQuery."""
        pass

    async def parse_async(self, query: str) -> StructuredQuery:
        """Asynchronously parse query. Defaults to synchronous parse."""
        return self.parse(query)


class DeterministicQueryParser(BaseQueryParser):
    """
    Deterministic rule- and regex-based query parser.
    
    Extracts oceanographic parameters, vertical depths, spatial regions,
    temporal bounds, ARGO platform IDs, and comparison intents without
    requiring external LLM network latency or credentials.
    """

    # Regex patterns for ARGO Float / Platform WMO identifiers (e.g. 2903334, 5906432, 6901234)
    FLOAT_ID_PATTERNS = [
        re.compile(r"\b(?:float|platform|wmo|wmo\s*id|wmoid|argo)\s*(?:#|no\.?|num\.?)?\s*([1-7]\d{6})\b", re.IGNORECASE),
        re.compile(r"\b\b([1-7]\d{6})\b"),  # Standard 7-digit ARGO WMO number
    ]

    # Regex patterns for Depth / Pressure
    # e.g., "at 100 meters", "at 100m", "100 dbar", "depth 150 m"
    EXACT_DEPTH_PATTERN = re.compile(
        r"(?:at|depth\s*(?:of)?|level\s*(?:of)?)\s*(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|dbar\b|decibars?\b)",
        re.IGNORECASE,
    )
    
    # e.g., "between 0 and 500 meters", "from 50m to 200m", "0 - 500 meters", "0 to 500m"
    DEPTH_RANGE_PATTERN = re.compile(
        r"(?:between|from)?\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|dbar)?\s*(?:to|and|-)\s*(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|dbar\b|decibars?\b)",
        re.IGNORECASE,
    )

    # Regex patterns for Radius
    # e.g., "within 50 km", "radius of 20km", "radius 100 km"
    RADIUS_PATTERN = re.compile(
        r"(?:within|radius\s*(?:of)?|around)\s*(\d+(?:\.\d+)?)\s*(?:km\b|kilometers?\b)",
        re.IGNORECASE,
    )

    # Regex patterns for explicit Coordinates
    # e.g., "lat 13.08 lon 80.27", "13.08 N, 80.27 E", "latitude: 13.08, longitude: 80.27"
    COORDS_PATTERN = re.compile(
        r"(?:lat(?:itude)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[NS])?)[,\s]+(?:lon(?:gitude)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[EW])?)",
        re.IGNORECASE,
    )

    # Regex patterns for Year and Month
    YEAR_PATTERN = re.compile(r"\b(199\d|200\d|201\d|202\d|2030)\b")
    MONTHS = {
        "january": 1, "jan": 1,
        "february": 2, "feb": 2,
        "march": 3, "mar": 3,
        "april": 4, "apr": 4,
        "may": 5,
        "june": 6, "jun": 6,
        "july": 7, "jul": 7,
        "august": 8, "aug": 8,
        "september": 9, "sep": 9, "sept": 9,
        "october": 10, "oct": 10,
        "november": 11, "nov": 11,
        "december": 12, "dec": 12,
    }

    # Comparison trigger phrases
    COMPARISON_TRIGGERS = ["compare", "vs", "versus", "difference between", "differ from", "higher than", "lower than"]

    def parse(self, query: str) -> StructuredQuery:
        """
        Parse raw natural language oceanographic query into a validated StructuredQuery.
        """
        cleaned_query = query.strip()
        lower_query = cleaned_query.lower()

        # 1. Extract Platform / WMO Float ID
        platform_id = self._extract_platform_id(cleaned_query)

        # 2. Extract Oceanographic Parameters
        parameters = self._extract_parameters(lower_query)

        # 3. Extract Depth Criteria
        depth_filter = self._extract_depth(lower_query)

        # 4. Extract Location and Radius
        location_filter, explicit_radius = self._extract_location(lower_query, cleaned_query)
        radius_km = explicit_radius or (location_filter.radius_km if location_filter else None)

        # 5. Extract Temporal Constraints
        time_range = self._extract_time_range(lower_query)

        # 6. Extract Comparison details
        comparison_filter = self._extract_comparison(lower_query, cleaned_query)

        # 7. Classify Intent
        intent = self._classify_intent(
            lower_query=lower_query,
            platform_id=platform_id,
            comparison_filter=comparison_filter,
            depth_filter=depth_filter,
            location_filter=location_filter,
            time_range=time_range,
            parameters=parameters,
        )

        # 8. Compute Confidence Score
        confidence = self._calculate_confidence(
            intent=intent,
            parameters=parameters,
            location=location_filter,
            depth=depth_filter,
            platform_id=platform_id,
        )

        # 9. Build StructuredQuery
        structured_query = StructuredQuery(
            raw_query=cleaned_query,
            intent=intent,
            parameters=parameters,
            location=location_filter,
            radius_km=radius_km,
            depth=depth_filter,
            depth_min=depth_filter.depth_min if depth_filter else None,
            depth_max=depth_filter.depth_max if depth_filter else None,
            time_range=time_range,
            platform_id=platform_id,
            comparison=comparison_filter,
            confidence=confidence,
            is_valid=True,
            validation_errors=[],
        )

        # 10. Validate and Normalize
        return self._validate_and_normalize(structured_query)

    def _extract_platform_id(self, query: str) -> Optional[str]:
        """Extract 7-digit ARGO float WMO ID."""
        for pattern in self.FLOAT_ID_PATTERNS:
            match = pattern.search(query)
            if match:
                return match.group(1)
        return None

    def _extract_parameters(self, lower_query: str) -> List[OceanParameter]:
        """Identify standard ARGO parameters present in user query."""
        found_params: Set[OceanParameter] = set()
        
        # Sort synonyms by length descending to match multi-word phrases first (e.g. "sea surface temperature")
        sorted_synonyms = sorted(PARAMETER_SYNONYMS.items(), key=lambda x: len(x[0]), reverse=True)
        
        for synonym, param in sorted_synonyms:
            # Word boundary search for synonym
            pattern = rf"\b{re.escape(synonym)}\b"
            if re.search(pattern, lower_query):
                found_params.add(param)

        return list(found_params)

    def _extract_depth(self, lower_query: str) -> Optional[DepthFilter]:
        """Extract explicit or descriptive depth layers from query."""
        # Check range pattern first ("between 0 and 500 meters")
        range_match = self.DEPTH_RANGE_PATTERN.search(lower_query)
        if range_match:
            d_min = float(range_match.group(1))
            d_max = float(range_match.group(2))
            # Normalize if user said "from 500 to 0"
            if d_min > d_max:
                d_min, d_max = d_max, d_min
            return DepthFilter(depth_min=d_min, depth_max=d_max, unit="meters")

        # Check exact depth pattern ("at 100 meters", "depth 100m")
        exact_match = self.EXACT_DEPTH_PATTERN.search(lower_query)
        if exact_match:
            target_d = float(exact_match.group(1))
            return DepthFilter(
                depth_min=target_d,
                depth_max=target_d,
                target_depth=target_d,
                unit="meters",
            )

        # Check descriptive layer keywords (e.g., "surface", "thermocline", "deep sea")
        for layer_name, (l_min, l_max) in DEPTH_LAYERS.items():
            pattern = rf"\b{re.escape(layer_name)}\b"
            if re.search(pattern, lower_query):
                return DepthFilter(
                    depth_min=l_min,
                    depth_max=l_max,
                    unit="meters",
                )

        return None

    def _extract_location(
        self, lower_query: str, original_query: str
    ) -> Tuple[Optional[LocationFilter], Optional[float]]:
        """Extract recognized geographical location, bounding box, coordinates, and radius."""
        # Check for explicit radius (e.g. "within 50 km")
        explicit_radius: Optional[float] = None
        radius_match = self.RADIUS_PATTERN.search(lower_query)
        if radius_match:
            explicit_radius = float(radius_match.group(1))

        # Check for numeric lat/lon coordinates
        coords_match = self.COORDS_PATTERN.search(original_query)
        if coords_match:
            lat = float(coords_match.group(1))
            lon = float(coords_match.group(2))
            return (
                LocationFilter(
                    name=f"Point ({lat}, {lon})",
                    latitude=lat,
                    longitude=lon,
                    radius_km=explicit_radius or 25.0,
                ),
                explicit_radius,
            )

        # Check known ocean geographic names (sorted by name length descending to catch e.g. "Equatorial Indian Ocean")
        sorted_locs = sorted(KNOWN_OCEAN_LOCATIONS.items(), key=lambda x: len(x[0]), reverse=True)
        for loc_key, loc_info in sorted_locs:
            pattern = rf"\b{re.escape(loc_key)}\b"
            if re.search(pattern, lower_query):
                bbox = None
                if "bounding_box" in loc_info:
                    b = loc_info["bounding_box"]
                    bbox = BoundingBox(
                        min_latitude=b[0],
                        min_longitude=b[1],
                        max_latitude=b[2],
                        max_longitude=b[3],
                    )

                loc_filter = LocationFilter(
                    name=loc_info["name"],
                    latitude=loc_info.get("latitude"),
                    longitude=loc_info.get("longitude"),
                    bounding_box=bbox,
                    radius_km=explicit_radius or loc_info.get("default_radius_km", 50.0),
                )
                return loc_filter, explicit_radius

        return None, explicit_radius

    def _extract_time_range(self, lower_query: str) -> Optional[TimeRangeFilter]:
        """Extract temporal boundaries, year, month, or season."""
        year: Optional[int] = None
        month: Optional[int] = None
        season: Optional[str] = None

        year_match = self.YEAR_PATTERN.search(lower_query)
        if year_match:
            year = int(year_match.group(1))

        for month_name, m_num in self.MONTHS.items():
            if re.search(rf"\b{re.escape(month_name)}\b", lower_query):
                month = m_num
                break

        for s_name, s_val in SEASON_MAPPINGS.items():
            if re.search(rf"\b{re.escape(s_name)}\b", lower_query):
                season = s_val
                break

        if year or month or season:
            start_date = None
            end_date = None
            if year and month:
                start_date = f"{year:04d}-{month:02d}-01"
                # Approximation for month end
                end_date = f"{year:04d}-{month:02d}-28"
            elif year:
                start_date = f"{year:04d}-01-01"
                end_date = f"{year:04d}-12-31"

            return TimeRangeFilter(
                start_date=start_date,
                end_date=end_date,
                year=year,
                month=month,
                season=season,
            )

        return None

    def _extract_comparison(self, lower_query: str, original_query: str) -> Optional[ComparisonFilter]:
        """Identify comparison queries and extract comparison targets."""
        is_comparison = any(trigger in lower_query for trigger in self.COMPARISON_TRIGGERS)
        if not is_comparison:
            return None

        # Check for "X vs Y" or "compare X and Y" between known locations
        found_locations: List[Dict[str, Any]] = []
        for loc_key, loc_info in KNOWN_OCEAN_LOCATIONS.items():
            if re.search(rf"\b{re.escape(loc_key)}\b", lower_query):
                found_locations.append(loc_info)

        if len(found_locations) >= 2:
            loc_a_info = found_locations[0]
            loc_b_info = found_locations[1]
            return ComparisonFilter(
                comparison_type="location",
                target_a=loc_a_info["name"],
                target_b=loc_b_info["name"],
                location_a=LocationFilter(
                    name=loc_a_info["name"],
                    latitude=loc_a_info.get("latitude"),
                    longitude=loc_a_info.get("longitude"),
                ),
                location_b=LocationFilter(
                    name=loc_b_info["name"],
                    latitude=loc_b_info.get("latitude"),
                    longitude=loc_b_info.get("longitude"),
                ),
            )

        return ComparisonFilter(comparison_type="general", target_a=None, target_b=None)

    def _classify_intent(
        self,
        lower_query: str,
        platform_id: Optional[str],
        comparison_filter: Optional[ComparisonFilter],
        depth_filter: Optional[DepthFilter],
        location_filter: Optional[LocationFilter],
        time_range: Optional[TimeRangeFilter],
        parameters: List[OceanParameter],
    ) -> QueryIntent:
        """Classify user intent based on extracted entities and keywords."""
        # 1. Float / Platform specific query
        if platform_id or any(word in lower_query for word in ["trajectory", "track float", "float status"]):
            return QueryIntent.FLOAT_QUERY

        # 2. Comparison query
        if comparison_filter is not None:
            return QueryIntent.COMPARISON_QUERY

        # 3. Profile query (depth is specified, or explicit "profile" / "vertical" request)
        if depth_filter is not None or "profile" in lower_query or "vertical" in lower_query:
            return QueryIntent.PROFILE_QUERY

        # 4. Temporal query (trend / time-series / specific historical span without single depth)
        if time_range is not None and any(w in lower_query for w in ["trend", "history", "time series", "over time", "change"]):
            return QueryIntent.TEMPORAL_QUERY

        # 5. Spatial query (geographic area / region / bounding box specified)
        if location_filter is not None and (location_filter.bounding_box is not None or len(parameters) > 0):
            return QueryIntent.SPATIAL_QUERY

        # 6. Fallback if parameters are present
        if len(parameters) > 0:
            return QueryIntent.PROFILE_QUERY

        # 7. Unrecognized query
        return QueryIntent.UNKNOWN

    def _calculate_confidence(
        self,
        intent: QueryIntent,
        parameters: List[OceanParameter],
        location: Optional[LocationFilter],
        depth: Optional[DepthFilter],
        platform_id: Optional[str],
    ) -> float:
        """Compute confidence score for the extraction (0.0 to 1.0)."""
        if intent == QueryIntent.UNKNOWN:
            return 0.1

        score = 0.5
        if parameters:
            score += 0.2
        if location:
            score += 0.15
        if depth:
            score += 0.1
        if platform_id:
            score += 0.25

        return min(1.0, round(score, 2))

    def _validate_and_normalize(self, sq: StructuredQuery) -> StructuredQuery:
        """Validate query parameters and populate error messages if invalid."""
        errors: List[str] = []

        # Validate unknown intent
        if sq.intent == QueryIntent.UNKNOWN:
            errors.append("Unable to determine oceanographic intent from query.")

        # Validate parameters vs intent
        if sq.intent in [QueryIntent.PROFILE_QUERY, QueryIntent.SPATIAL_QUERY, QueryIntent.COMPARISON_QUERY]:
            if not sq.parameters and not sq.platform_id:
                # If location is present but no parameter, default to Temperature or note warning
                errors.append("No specific oceanographic parameter (e.g. salinity, temperature) identified.")

        # Validate coordinates if present
        if sq.location:
            if sq.location.latitude is not None:
                if not (-90.0 <= sq.location.latitude <= 90.0):
                    errors.append(f"Latitude {sq.location.latitude} out of valid range [-90, 90].")
            if sq.location.longitude is not None:
                if not (-180.0 <= sq.location.longitude <= 180.0):
                    errors.append(f"Longitude {sq.location.longitude} out of valid range [-180, 180].")

        # Validate depth constraints
        if sq.depth:
            if sq.depth.depth_min is not None and sq.depth.depth_min < 0.0:
                errors.append(f"Depth min {sq.depth.depth_min} cannot be negative.")
            if sq.depth.depth_max is not None and sq.depth.depth_max > 6000.0:
                errors.append(f"Depth max {sq.depth.depth_max} exceeds maximum ARGO depth (6000m).")
            if (
                sq.depth.depth_min is not None
                and sq.depth.depth_max is not None
                and sq.depth.depth_min > sq.depth.depth_max
            ):
                errors.append(f"Depth min ({sq.depth.depth_min}) cannot exceed depth max ({sq.depth.depth_max}).")

        # Validate radius
        if sq.radius_km is not None and sq.radius_km <= 0.0:
            errors.append(f"Search radius {sq.radius_km}km must be positive.")

        sq.validation_errors = errors
        sq.is_valid = len(errors) == 0
        return sq
