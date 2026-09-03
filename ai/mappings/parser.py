"""
Query parser implementation converting natural-language oceanographic questions
into validated Pydantic StructuredQuery objects.

Includes an extensible BaseQueryParser interface and a high-performance
DeterministicQueryParser with regex and oceanographic domain heuristics.
"""

import abc
import calendar
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
        re.compile(r"\b([1-7]\d{6})\b"),  # Standard 7-digit ARGO WMO number
    ]

    # Regex patterns for Depth / Pressure
    # e.g., "at 100 meters", "at 500 metres", "at 100m", "at 200m", "100 dbar", "depth 150 m", "at 200 m"
    EXACT_DEPTH_PATTERN = re.compile(
        r"(?:at|depth\s*(?:of)?|level\s*(?:of)?)\s*(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|metres?\b|dbar\b|decibars?\b)",
        re.IGNORECASE,
    )
    
    # Standalone depth e.g., "at 200m", "200m depth", "500 metres depth"
    STANDALONE_DEPTH_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?|dbar|decibars?)\s+depth\b",
        re.IGNORECASE,
    )

    # Depth range e.g., "between 0 and 500 meters", "between 100m and 500m", "from 50m to 200m", "0 - 500 metres", "0 to 500m"
    DEPTH_RANGE_PATTERN = re.compile(
        r"(?:between|from)?\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?|dbar)?\s*(?:to|and|-)\s*(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|metres?\b|dbar\b|decibars?\b)",
        re.IGNORECASE,
    )

    # Depth comparison e.g., "compare ... at 100m and 500m", "at 100m vs 500m", "100 metres vs 500 metres"
    DEPTH_COMPARISON_PATTERN = re.compile(
        r"(?:at\s+)?(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|metres?\b|dbar\b)?\s*(?:and|vs|versus|to)\s*(\d+(?:\.\d+)?)\s*(?:m\b|meters?\b|metres?\b|dbar\b)",
        re.IGNORECASE,
    )

    # Regex patterns for Radius & Offshore Distances
    # e.g., "20 km offshore from Chennai", "within 50 km of Chennai", "radius of 20km", "radius 100 km", "50 km radius"
    RADIUS_PATTERNS = [
        re.compile(r"(\d+(?:\.\d+)?)\s*(?:km\b|kilometers?\b)\s*(?:offshore|off|radius)", re.IGNORECASE),
        re.compile(r"(?:within|radius\s*(?:of)?|around|within\s+a\s+radius\s+of)\s*(\d+(?:\.\d+)?)\s*(?:km\b|kilometers?\b)", re.IGNORECASE),
        re.compile(r"(\d+(?:\.\d+)?)\s*(?:km\b|kilometers?\b)\s*(?:radius|around)", re.IGNORECASE),
    ]

    # Regex patterns for explicit Geographic Coordinates
    # e.g., "13.08 N, 80.27 E", "13.08N, 80.27E", "13.08°N, 80.27°E", "lat 13.08 lon 80.27", "latitude 13.08, longitude 80.27"
    COORDS_CARDINAL_PATTERN = re.compile(
        r"([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSns])\s*[,/ ]+\s*([+-]?\d+(?:\.\d+)?)\s*°?\s*([EWew])",
        re.IGNORECASE,
    )
    
    COORDS_LABELED_PATTERN = re.compile(
        r"(?:lat(?:itude)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[NSns])?)[,\s]+(?:lon(?:gitude)?\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[EWew])?)",
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

    # Relative time expressions (e.g. "last 30 days", "past 7 days", "over the last 30 days")
    RELATIVE_DAYS_PATTERN = re.compile(
        r"(?:over\s+the\s+|in\s+the\s+|for\s+the\s+)?(?:last|past)\s+(\d+)\s+(days?|weeks?|months?)",
        re.IGNORECASE,
    )

    # Comparison trigger phrases
    COMPARISON_TRIGGERS = ["compare", "vs", "versus", "difference between", "differ from", "higher than", "lower than", "comparison"]

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

        # 3. Extract Comparison details (both location and depth comparisons)
        comparison_filter = self._extract_comparison(lower_query, cleaned_query)

        # 4. Extract Depth Criteria (if not already captured in depth comparison)
        depth_filter = self._extract_depth(lower_query, comparison_filter)

        # 5. Extract Location and Radius
        location_filter, explicit_radius = self._extract_location(lower_query, cleaned_query)
        radius_km = explicit_radius or (location_filter.radius_km if location_filter else None)

        # 6. Extract Temporal Constraints
        time_range = self._extract_time_range(lower_query)

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
            time_range=time_range,
            comparison=comparison_filter,
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
                # Ensure it is not a year or depth value
                candidate = match.group(1)
                if len(candidate) == 7:
                    return candidate
        return None

    def _extract_parameters(self, lower_query: str) -> List[OceanParameter]:
        """Identify standard ARGO parameters present in user query."""
        found_params: Set[OceanParameter] = set()
        
        # Sort synonyms by length descending to match multi-word phrases first (e.g. "oxygen concentration", "sea water temperature")
        sorted_synonyms = sorted(PARAMETER_SYNONYMS.items(), key=lambda x: len(x[0]), reverse=True)
        
        for synonym, param in sorted_synonyms:
            # Word boundary search for synonym
            pattern = rf"\b{re.escape(synonym)}\b"
            if re.search(pattern, lower_query):
                found_params.add(param)

        return list(found_params)

    def _extract_depth(
        self, lower_query: str, comparison_filter: Optional[ComparisonFilter]
    ) -> Optional[DepthFilter]:
        """Extract explicit or descriptive depth layers from query."""
        # If comparison is on depth, return the primary or None
        if comparison_filter and comparison_filter.comparison_type == "depth":
            return comparison_filter.depth_a

        # Check range pattern first ("between 0 and 500 meters", "between 100m and 500m")
        # Ensure it's not a comparison trigger (e.g. "compare salinity at 100m and 500m")
        is_comparison = any(trigger in lower_query for trigger in self.COMPARISON_TRIGGERS)
        if not is_comparison:
            range_match = self.DEPTH_RANGE_PATTERN.search(lower_query)
            if range_match:
                d_min = float(range_match.group(1))
                d_max = float(range_match.group(2))
                if d_min > d_max:
                    d_min, d_max = d_max, d_min
                return DepthFilter(depth_min=d_min, depth_max=d_max, unit="meters")

        # Check exact depth pattern ("at 100 meters", "at 100m", "at 200m")
        exact_match = self.EXACT_DEPTH_PATTERN.search(lower_query)
        if exact_match:
            target_d = float(exact_match.group(1))
            return DepthFilter(
                depth_min=target_d,
                depth_max=target_d,
                target_depth=target_d,
                unit="meters",
            )

        # Check standalone depth pattern ("200m depth")
        standalone_match = self.STANDALONE_DEPTH_PATTERN.search(lower_query)
        if standalone_match:
            target_d = float(standalone_match.group(1))
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
        # Check for explicit radius using all patterns
        explicit_radius: Optional[float] = None
        for pattern in self.RADIUS_PATTERNS:
            radius_match = pattern.search(lower_query)
            if radius_match:
                explicit_radius = float(radius_match.group(1))
                break

        # 1. Check for Cardinal Coordinates (e.g. "13.08 N, 80.27 E" or "13.08°N, 80.27°E")
        cardinal_match = self.COORDS_CARDINAL_PATTERN.search(original_query)
        if cardinal_match:
            lat_val = float(cardinal_match.group(1))
            lat_dir = cardinal_match.group(2).upper()
            lon_val = float(cardinal_match.group(3))
            lon_dir = cardinal_match.group(4).upper()

            lat = -lat_val if lat_dir == "S" else lat_val
            lon = -lon_val if lon_dir == "W" else lon_val

            return (
                LocationFilter(
                    name=f"Point ({lat}, {lon})",
                    latitude=lat,
                    longitude=lon,
                    radius_km=explicit_radius or 25.0,
                ),
                explicit_radius,
            )

        # 2. Check for Labeled Coordinates (e.g. "lat 13.08 lon 80.27")
        coords_match = self.COORDS_LABELED_PATTERN.search(original_query)
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

        # 3. Check known ocean geographic names (sorted by name length descending)
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

        # 4. Check for candidate spatial entity in query (e.g. "near Coorg", "around Bangalore", "in Delhi", "off Seattle")
        candidate_match = re.search(r"\b(?:near|around|in|off|close to|vicinity of)\s+([A-Za-z][A-Za-z\s]{1,30})\b", original_query, re.IGNORECASE)
        if candidate_match:
            candidate_raw = candidate_match.group(1).strip()
            # Exclude common non-location phrases, parameters, and time words
            stop_phrases = {
                "the", "a", "an", "the ocean", "the sea", "the bay", "the surface", "the water", "the deep",
                "argo", "floatchat", "data", "observations", "floats", "float", "depth", "all levels",
                "temperature", "salinity", "pressure", "oxygen", "chlorophyll", "nitrate", "ph",
                "meters", "metres", "dbar", "decibars", "january", "february", "march", "april", "may",
                "june", "july", "august", "september", "october", "november", "december",
                "summer", "winter", "monsoon", "spring", "autumn", "last month", "last year", "today"
            }
            cand_clean = candidate_raw.lower()
            # Strip trailing punctuation or question mark
            cand_clean = re.sub(r"[?.,!].*$", "", cand_clean).strip()
            candidate_title = re.sub(r"[?.,!].*$", "", candidate_raw).strip().title()

            if cand_clean and cand_clean not in stop_phrases and not any(p in cand_clean for p in ["meter", "metre", "dbar"]):
                return (
                    LocationFilter(
                        name=candidate_title,
                        latitude=None,
                        longitude=None,
                        bounding_box=None,
                        radius_km=explicit_radius or 50.0,
                    ),
                    explicit_radius,
                )

        return None, explicit_radius

    def _extract_time_range(self, lower_query: str) -> Optional[TimeRangeFilter]:
        """Extract temporal boundaries, year, month, season, or relative window."""
        # 1. Check for relative time window (e.g., "last 30 days", "past 2 weeks")
        rel_match = self.RELATIVE_DAYS_PATTERN.search(lower_query)
        if rel_match:
            count = int(rel_match.group(1))
            unit = rel_match.group(2).lower()
            if "week" in unit:
                days = count * 7
            elif "month" in unit:
                days = count * 30
            else:
                days = count

            return TimeRangeFilter(
                relative_days=days,
                description=f"last {days} days",
            )

        # 2. Check for Year, Month, Season
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
            desc = ""
            if year and month:
                last_day = calendar.monthrange(year, month)[1]
                start_date = f"{year:04d}-{month:02d}-01"
                end_date = f"{year:04d}-{month:02d}-{last_day:02d}"
                month_name_str = [k for k, v in self.MONTHS.items() if v == month and len(k) > 3][0].capitalize()
                desc = f"{month_name_str} {year}"
            elif year:
                start_date = f"{year:04d}-01-01"
                end_date = f"{year:04d}-12-31"
                desc = f"{year}"

            if season:
                desc = f"{desc} {season}".strip()

            return TimeRangeFilter(
                start_date=start_date,
                end_date=end_date,
                year=year,
                month=month,
                season=season,
                description=desc if desc else None,
            )

        return None

    def _extract_comparison(self, lower_query: str, original_query: str) -> Optional[ComparisonFilter]:
        """Identify comparison queries (depth-level or location-level)."""
        is_comparison = any(trigger in lower_query for trigger in self.COMPARISON_TRIGGERS)
        if not is_comparison:
            return None

        # 1. Check for Depth comparison: e.g., "compare salinity at 100m and 500m"
        depth_comp_match = self.DEPTH_COMPARISON_PATTERN.search(lower_query)
        if depth_comp_match:
            d_a = float(depth_comp_match.group(1))
            d_b = float(depth_comp_match.group(2))
            return ComparisonFilter(
                comparison_type="depth",
                target_a=f"{d_a}m",
                target_b=f"{d_b}m",
                depth_a=DepthFilter(target_depth=d_a, depth_min=d_a, depth_max=d_a, unit="meters"),
                depth_b=DepthFilter(target_depth=d_b, depth_min=d_b, depth_max=d_b, unit="meters"),
            )

        # 2. Check for Location comparison: e.g., "compare Arabian Sea vs Bay of Bengal"
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
        # 0. General / Conversational / Data Source / Explanatory inquiries
        general_triggers = [
            "data source", "where is", "where do", "where does", "fetch", "fetched",
            "what data", "who provides", "how does", "what is argo", "what is erddap",
            "what does this app", "what can you do", "help", "about floatchat",
            "how do you work", "explain argo", "how does this work", "source of data",
            "data provenance", "what is this", "tell me about", "what is the data",
            "who built", "what is your source", "how are floats", "explain the dataset"
        ]
        if any(t in lower_query for t in general_triggers):
            if not location_filter and not platform_id and not comparison_filter and not depth_filter and not parameters:
                return QueryIntent.GENERAL_QUERY

        # 1. Float / Platform specific query
        if platform_id or any(word in lower_query for word in ["trajectory", "track float", "float status", "argo float"]):
            if platform_id:
                return QueryIntent.FLOAT_QUERY

        # 2. Comparison query
        if comparison_filter is not None:
            return QueryIntent.COMPARISON_QUERY

        # 3. Profile query (depth is specified, or explicit "profile" / "vertical" request)
        if depth_filter is not None or "profile" in lower_query or "vertical" in lower_query:
            return QueryIntent.PROFILE_QUERY

        # 4. Temporal query (trend / time-series / specific historical span without single depth)
        if time_range is not None:
            return QueryIntent.TEMPORAL_QUERY

        # 5. Spatial query (geographic area / region / bounding box / radius search)
        if location_filter is not None or any(w in lower_query for w in ["near", "within", "around", "offshore"]):
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
        time_range: Optional[TimeRangeFilter],
        comparison: Optional[ComparisonFilter],
    ) -> float:
        """Compute confidence score for the extraction (0.0 to 1.0)."""
        if intent == QueryIntent.GENERAL_QUERY:
            return 0.95

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
        if time_range:
            score += 0.1
        if comparison:
            score += 0.15

        return min(1.0, round(score, 2))

    def _validate_and_normalize(self, sq: StructuredQuery) -> StructuredQuery:
        """Validate query parameters and populate error messages if invalid."""
        if sq.intent == QueryIntent.GENERAL_QUERY:
            sq.is_valid = True
            sq.validation_errors = []
            sq.confidence = 0.95
            return sq

        errors: List[str] = []

        # Validate unknown intent
        if sq.intent == QueryIntent.UNKNOWN:
            errors.append("Unable to determine oceanographic intent from query.")
            errors.append("No recognized oceanographic parameters (e.g. salinity, temperature) or ARGO platform found.")

        # Validate parameters vs intent
        if sq.intent in [QueryIntent.PROFILE_QUERY, QueryIntent.SPATIAL_QUERY, QueryIntent.COMPARISON_QUERY]:
            if not sq.parameters and not sq.platform_id and not (sq.location and ("argo" in sq.raw_query.lower() or "measurement" in sq.raw_query.lower())):
                errors.append("No specific oceanographic parameter (e.g. salinity, temperature) identified.")

        # Validate coordinates if present
        if sq.location:
            if sq.location.latitude is not None:
                if not (-90.0 <= sq.location.latitude <= 90.0):
                    errors.append(f"Latitude {sq.location.latitude} is out of valid range [-90, 90].")
            if sq.location.longitude is not None:
                if not (-180.0 <= sq.location.longitude <= 180.0):
                    errors.append(f"Longitude {sq.location.longitude} is out of valid range [-180, 180].")

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
        
        # Lower confidence if invalid
        if not sq.is_valid:
            sq.confidence = min(sq.confidence, 0.2)

        return sq
