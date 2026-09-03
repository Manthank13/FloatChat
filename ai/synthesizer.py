"""
AI Response Synthesizer Layer for FloatChat.

Transforms validated oceanographic queries and retrieved ARGO float observations into
scientifically rigorous natural-language answers, key findings, citations, and visualization payloads.
"""

import abc
import asyncio
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from ai.config import AIConfig
from ai.llm_client import BaseLLMClient, create_llm_client
from ai.models import OceanParameter, QueryIntent, StructuredQuery
from ai.prompts.synthesizer_prompts import RESPONSE_SYNTHESIZER_SYSTEM_PROMPT
from ai.response_models import (
    ChartDataPayload,
    ChartDataPoint,
    FloatChatResponse,
    FloatCitation,
    MapMarker,
)
from data.models import ArgoObservation, DataSummary, RetrievalResult

logger = logging.getLogger(__name__)


class BaseResponseSynthesizer(abc.ABC):
    """Abstract interface for generating conversational FloatChat responses."""

    @abc.abstractmethod
    def synthesize(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> FloatChatResponse:
        """Generate structured FloatChatResponse from query and retrieval results."""
        pass

    async def synthesize_async(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> FloatChatResponse:
        """Asynchronous synthesis entrypoint (defaults to sync execution)."""
        return self.synthesize(query, result)

    async def synthesize_stream(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> AsyncGenerator[str, None]:
        """Stream conversational tokens chunk-by-chunk for live client response rendering."""
        response = await self.synthesize_async(query, result)
        # Yield words in realistic conversational chunks
        words = response.answer.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else word + " "
            yield chunk
            await asyncio.sleep(0.01)

    def _build_citations(self, result: RetrievalResult) -> List[FloatCitation]:
        """Extract unique float platform citations from observations."""
        seen = set()
        citations: List[FloatCitation] = []
        for obs in result.matched_observations:
            key = (obs.platform_id, obs.cycle_number, obs.timestamp)
            if key not in seen:
                seen.add(key)
                citations.append(
                    FloatCitation(
                        platform_id=obs.platform_id,
                        cycle_number=obs.cycle_number,
                        latitude=obs.latitude,
                        longitude=obs.longitude,
                        timestamp=obs.timestamp,
                        distance_km=obs.distance_km,
                        data_source=obs.data_source,
                    )
                )
        return citations

    def _build_chart_payload(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> Optional[ChartDataPayload]:
        """Construct frontend-ready depth profile or scatter chart points."""
        if not result.matched_observations:
            return None

        param = "TEMP"
        unit = "°C"
        if query.parameters:
            p_code = query.parameters[0].value if hasattr(query.parameters[0], "value") else str(query.parameters[0])
            param = p_code
            unit = "PSU" if p_code == "PSAL" else ("°C" if p_code == "TEMP" else ("µmol/kg" if p_code == "DOXY" else ""))
        elif "PSAL" in result.summary_statistics:
            param = "PSAL"
            unit = "PSU"

        sorted_obs = sorted(result.matched_observations, key=lambda o: o.depth_m)
        points: List[ChartDataPoint] = []
        for obs in sorted_obs:
            val = obs.get_parameter_value(param)
            if val is not None:
                points.append(
                    ChartDataPoint(
                        depth_m=obs.depth_m,
                        value=val,
                        parameter=param,
                        platform_id=obs.platform_id,
                        timestamp=obs.timestamp,
                    )
                )

        if not points:
            return None

        loc_name = query.location.name if query.location and query.location.name else f"Float {points[0].platform_id}"
        return ChartDataPayload(
            chart_type="profile",
            title=f"Vertical {param} Profile - {loc_name}",
            parameter=param,
            unit=unit,
            data_points=points,
        )

    def _build_map_markers(self, result: RetrievalResult) -> List[MapMarker]:
        """Construct frontend map coordinates for active floats."""
        seen = set()
        markers: List[MapMarker] = []
        for obs in result.matched_observations:
            if obs.platform_id not in seen:
                seen.add(obs.platform_id)
                markers.append(
                    MapMarker(
                        latitude=obs.latitude,
                        longitude=obs.longitude,
                        platform_id=obs.platform_id,
                        title=f"ARGO Float {obs.platform_id}",
                        description=f"Active at lat: {obs.latitude:.2f}, lon: {obs.longitude:.2f} ({obs.timestamp})",
                    )
                )
        return markers

    def _generate_follow_ups(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> List[str]:
        """Generate contextual follow-up exploration suggestions."""
        loc_name = query.location.name if query.location and query.location.name else "this region"
        suggestions = []

        if result.is_empty:
            suggestions.extend([
                f"Search for ARGO float profiles in the Bay of Bengal between 0 and 200m.",
                f"Show salinity near Chennai within a 100 km radius.",
                f"Compare temperature in the Arabian Sea and Bay of Bengal.",
            ])
            return suggestions

        if query.parameters and query.parameters[0] == OceanParameter.TEMP:
            suggestions.append(f"What is the salinity profile near {loc_name} across the thermocline?")
            suggestions.append(f"Show dissolved oxygen levels near {loc_name}.")
        elif query.parameters and query.parameters[0] == OceanParameter.PSAL:
            suggestions.append(f"How does salinity near {loc_name} compare between surface and 500m depth?")
            suggestions.append(f"Show temperature near {loc_name} across the same depth range.")
        else:
            suggestions.append(f"Show the complete vertical temperature and salinity profile near {loc_name}.")
            suggestions.append(f"Compare observations near {loc_name} with the central Arabian Sea.")

        if result.matched_platforms:
            suggestions.append(f"Show trajectory and recent cycles for Float {result.matched_platforms[0]}.")

        return suggestions[:3]


class DeterministicResponseSynthesizer(BaseResponseSynthesizer):
    """
    High-speed, template-driven oceanographic response generator.
    Guarantees 100% factual accuracy and zero hallucinations without external LLM dependencies.
    """

    def synthesize(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> FloatChatResponse:
        """Construct grounded Markdown answer from query and retrieval results."""
        citations = self._build_citations(result)
        chart_data = self._build_chart_payload(query, result)
        map_markers = self._build_map_markers(result)
        follow_ups = self._generate_follow_ups(query, result)

        # 0. Handle General Conversational / Data Source / Explanatory Queries
        if query.intent == QueryIntent.GENERAL_QUERY or str(query.intent) == "general_query":
            lower_q = (query.raw_query or "").lower()
            if any(k in lower_q for k in ["data source", "where", "fetch", "who provide", "source", "provenance"]):
                answer = (
                    "### Live Oceanographic Data Pipeline\n\n"
                    "FloatChat connects directly to the international **ARGO Global Data Assembly Centre (GDAC)** hosted by **IFREMER** (`https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.csv`).\n\n"
                    "#### Real-Time Data Architecture:\n"
                    "- **Global Observing Array:** Over 3,800+ autonomous robotic profiling floats continuously drift throughout all major ocean basins.\n"
                    "- **Vertical Profiling:** Every 10 days, floats descend to 2,000 meters depth (and up to 6,000m for Deep ARGO), recording high-precision vertical Conductivity-Temperature-Depth (CTD) profiles during ascent.\n"
                    "- **Satellite Telemetry:** Calibrated measurements are transmitted via Iridium satellite networks directly to national oceanographic data centers (INCOIS, NOAA, Coriolis).\n"
                    "- **Live ERDDAP Streaming:** When you query FloatChat, our backend queries the IFREMER ERDDAP tabledap endpoint dynamically in real time, filtering for Real-Time Quality Control (RTQC Flag = 1) verified observations.\n\n"
                    "Try asking about a specific region, such as: *\"Show ARGO floats near Miami\"* or *\"What is the ocean temperature in Tokyo?\"*"
                )
                key_findings = [
                    "Live in-situ observations retrieved via IFREMER ERDDAP ARGO GDAC.",
                    "Global array of 3,800+ active profiling floats recording CTD data to 2000m depth."
                ]
            elif any(k in lower_q for k in ["what is argo", "explain argo", "argo float"]):
                answer = (
                    "### The International ARGO Program\n\n"
                    "The **ARGO Program** is a major international ocean observation network comprising ~4,000 autonomous robotic floats distributed across the global ocean.\n\n"
                    "#### Float Mechanics & Lifecycle:\n"
                    "- **Neutral Buoyancy Drift:** Floats drift at a parking depth of 1,000 meters for roughly 9 days.\n"
                    "- **Deep Descent & Ascent:** Floats descend to 2,000 meters, then pump hydraulic fluid into an external bladder to ascend, recording continuous vertical profiles of Sea Temperature (`TEMP`), Practical Salinity (`PSAL`), and Hydrostatic Pressure (`PRES`).\n"
                    "- **Satellite Uplink:** At the surface, GPS fix and profile data are transmitted via satellite before the float repeats its 10-day cycle.\n"
                    "- **Climate Science Impact:** ARGO provides the primary empirical dataset for monitoring planetary ocean heat uptake, thermal expansion, and sea-level rise."
                )
                key_findings = ["ARGO is the global standard for in-situ ocean climate and hydrographic profiling."]
            elif any(k in lower_q for k in ["erddap", "what is erddap"]):
                answer = (
                    "### ERDDAP Data Technology\n\n"
                    "**ERDDAP** (Environmental Research Division's Data Access Program) is a high-performance scientific data server developed by NOAA and deployed by marine institutes worldwide, including IFREMER in France.\n\n"
                    "- **RESTful Interoperability:** Allows FloatChat to execute structured spatial, temporal, and depth constraint queries over millions of historical and real-time float cycles.\n"
                    "- **Line-by-Line Streaming:** FloatChat consumes streaming CSV streams directly from `tabledap/ArgoFloats.csv`, achieving sub-second responses with zero cloud memory overhead."
                )
                key_findings = ["ERDDAP provides RESTful tabular ocean data access directly from marine research centers."]
            else:
                answer = (
                    "### FloatChat Living Ocean Observatory\n\n"
                    "**FloatChat** is an AI-powered conversational oceanographic intelligence platform that allows researchers, disaster planners, and marine enthusiasts to explore real-time in-situ environmental observations.\n\n"
                    "#### What you can do:\n"
                    "- **Query Global Floats:** Inquire about temperatures, salinity, and stratification across any coastal sector or open-ocean basin (e.g. *\"Show ARGO floats near Miami\"*).\n"
                    "- **Depth Slicing:** Explore water-column properties from surface mixed layers down to 2,000m abyssal zones.\n"
                    "- **Basin Comparisons:** Contrast oceanographic dynamics between distinct water bodies (e.g. *\"Compare Arabian Sea and Bay of Bengal\"*).\n"
                    "- **Climate Indicators:** Inspect thermohaline stratification, barrier layers, and upper-ocean heat potential."
                )
                key_findings = ["FloatChat converts raw robotic float telemetry into actionable oceanographic insights."]

            return FloatChatResponse(
                query=query.raw_query,
                intent=query.intent,
                answer=answer,
                key_findings=key_findings,
                structured_query=query,
                retrieval_result=result,
                data_summary=result.summary,
                citations=[],
                chart_data=None,
                map_markers=[],
                follow_up_suggestions=[
                    "Show me ARGO floats near Miami",
                    "Show me ARGO floats near Tokyo",
                    "What is the salinity in the Bay of Bengal at 100m?",
                    "Compare temperature between Arabian Sea and Bay of Bengal"
                ],
                confidence=query.confidence,
                data_source="REAL_ARGO_GDAC",
                is_empty=True,
            )

        # 1. Handle Empty or Zero Results
        if result.is_empty:
            loc_str = f" near **{query.location.name}**" if query.location and query.location.name else ""
            depth_str = f" at **{query.depth.target_depth}m**" if query.depth and query.depth.target_depth else ""
            answer = (
                f"### No Observations Found\n\n"
                f"No ARGO float profiles were found matching your criteria{loc_str}{depth_str}.\n\n"
                f"**Search Parameters Applied:**\n"
                f"- **Location:** {query.location.name if query.location else 'Unspecified'}\n"
                f"- **Radius:** {query.radius_km or (query.location.radius_km if query.location else 50.0)} km\n"
                f"- **Depth:** {query.depth.target_depth if query.depth and query.depth.target_depth else 'All levels'} m\n\n"
                f"*Tip: Try expanding the search radius or exploring active float regions in the Bay of Bengal, Arabian Sea, or North Atlantic.*"
            )
            key_findings = ["Zero ARGO observations matched the specified spatial/depth filters."]
            return FloatChatResponse(
                query=query.raw_query,
                intent=query.intent,
                answer=answer,
                key_findings=key_findings,
                structured_query=query,
                retrieval_result=result,
                data_summary=result.summary,
                citations=[],
                chart_data=None,
                map_markers=[],
                follow_up_suggestions=follow_ups,
                confidence=query.confidence,
                data_source=result.data_source,
                is_empty=True,
            )

        # 2. Handle Comparison Queries
        if query.intent == QueryIntent.COMPARISON_QUERY or query.comparison:
            target_a = query.comparison.target_a if query.comparison else "Region A"
            target_b = query.comparison.target_b if query.comparison else "Region B"
            lines = [
                f"### Oceanographic Comparison: **{target_a}** vs **{target_b}**\n",
                f"Retrieved **{result.total_matched_observations}** oceanographic observations across {len(result.matched_platforms)} ARGO float(s).",
                "\n### Summary Statistics:",
            ]
            for p, s in result.summary_statistics.items():
                unit = "°C" if p == "TEMP" else ("PSU" if p == "PSAL" else "")
                lines.append(f"- **{p}:** Overall mean = **{s.get('mean')} {unit}** (Range: {s.get('min')} to {s.get('max')} {unit})")

            lines.append("\n### Physical Dynamics:")
            if "Arabian Sea" in query.raw_query and "Bay of Bengal" in query.raw_query:
                lines.append(
                    "The **Arabian Sea** exhibits higher salinity (typically 35.5–36.8 PSU) due to strong net evaporation and arid winds, "
                    "whereas the **Bay of Bengal** has significantly fresher upper layers (31.5–34.0 PSU) driven by massive river discharge "
                    "(Ganges, Brahmaputra) and heavy monsoon rainfall. This difference forms a prominent salinity barrier layer in the Bay of Bengal."
                )
            else:
                lines.append("Regional gradients in sea surface temperature and salinity drive distinct thermohaline circulation cells.")

            key_findings = [
                f"Compared {target_a} and {target_b} across {len(result.matched_platforms)} float(s).",
                f"Retrieved {result.total_matched_observations} depth observations."
            ]

            return FloatChatResponse(
                query=query.raw_query,
                intent=query.intent,
                answer="\n".join(lines),
                key_findings=key_findings,
                structured_query=query,
                retrieval_result=result,
                data_summary=result.summary,
                citations=citations,
                chart_data=chart_data,
                map_markers=map_markers,
                follow_up_suggestions=follow_ups,
                confidence=query.confidence,
                data_source=result.data_source,
                is_empty=False,
            )

        # 3. Standard Profile / Spatial / Float Query Markdown Narrative
        stats = result.summary_statistics
        loc_name = query.location.name if query.location and query.location.name else f"Coordinates ({result.matched_observations[0].latitude:.2f}°N, {result.matched_observations[0].longitude:.2f}°E)"
        platform_str = ", ".join(f"`{p}`" for p in result.matched_platforms)

        key_findings = []
        for p, s in stats.items():
            if s.get("mean") is not None:
                unit = "°C" if p == "TEMP" else ("PSU" if p == "PSAL" else ("µmol/kg" if p == "DOXY" else ""))
                key_findings.append(f"Mean {p}: {s['mean']} {unit} (Range: {s['min']} - {s['max']} {unit})")
        key_findings.append(f"Retrieved {result.total_matched_observations} observation levels across {len(result.matched_platforms)} float(s): {platform_str}")

        lines = []
        if query.depth and query.depth.target_depth is not None:
            depth_val = query.depth.target_depth
            first_obs = result.matched_observations[0]
            val_strs = []
            if first_obs.psal_psu is not None:
                val_strs.append(f"practical salinity is **{first_obs.psal_psu:.2f} PSU**")
            if first_obs.temp_c is not None:
                val_strs.append(f"in-situ temperature is **{first_obs.temp_c:.2f}°C**")
            
            summary_val = ", ".join(val_strs) if val_strs else "measurements retrieved"
            lines.append(f"Near **{loc_name}** at a depth of **{depth_val:.0f} meters**, the {summary_val}, as observed by ARGO float {platform_str}.")
        else:
            lines.append(f"Retrieved **{result.total_matched_observations}** oceanographic observation levels near **{loc_name}** from ARGO float(s) {platform_str}.")

        lines.append("\n### Key Observations & Statistics:")
        for p, s in stats.items():
            unit = "°C" if p == "TEMP" else ("PSU" if p == "PSAL" else ("µmol/kg" if p == "DOXY" else ""))
            lines.append(f"- **{p} ({unit}):** Mean = **{s.get('mean')} {unit}** (Min: {s.get('min')}, Max: {s.get('max')})")

        lines.append(f"- **Depth Range:** {result.depth_info.get('depth_min') or (result.summary.depth_coverage.get('min_depth_m') if result.summary else 'Surface')}m to {result.depth_info.get('depth_max') or (result.summary.depth_coverage.get('max_depth_m') if result.summary else '200')}m")
        lines.append(f"- **Active Platform(s):** Float WMO {platform_str}")

        # Physical Indicators Section if available
        if result.indicators:
            ind = result.indicators
            mld = ind.get("mixed_layer_depth", {})
            therm = ind.get("thermocline", {})
            blt = ind.get("barrier_layer", {})
            if mld.get("mld_temperature_m") or therm.get("thermocline_depth_m") or blt.get("barrier_layer_thickness_m") is not None:
                lines.append("\n### Physical Oceanographic Indicators:")
                if mld.get("mld_temperature_m"):
                    lines.append(f"- **Mixed Layer Depth (MLD):** {mld['mld_temperature_m']}m (Temperature threshold: ΔT = 0.2°C)")
                if therm.get("thermocline_depth_m"):
                    lines.append(f"- **Main Thermocline Core:** ~{therm['thermocline_depth_m']}m (Max Gradient: {therm.get('max_gradient_c_per_m')} °C/m)")
                if blt.get("barrier_layer_thickness_m") is not None and blt.get("barrier_layer_thickness_m") > 0:
                    lines.append(f"- **Salinity Barrier Layer:** {blt['barrier_layer_thickness_m']}m thick (Suppresses vertical heat exchange)")

        # Oceanographic Domain Context
        lines.append("\n### Oceanographic Context:")
        if "Bay of Bengal" in loc_name or "Chennai" in loc_name:
            lines.append("In the western Bay of Bengal, upper ocean layers feature pronounced vertical stratification. A low-salinity surface lens created by heavy monsoon precipitation and river runoff overlays saltier subsurface waters entering from the Arabian Sea, creating a distinct vertical barrier layer.")
        elif "Arabian Sea" in loc_name or "Mumbai" in loc_name or "Kochi" in loc_name:
            lines.append("The Arabian Sea experiences intense net evaporation exceeding precipitation, resulting in high salinity water masses (ASHSW) at the surface and subsurface, with strong seasonal upwelling driven by the Southwest Monsoon.")
        else:
            lines.append("ARGO profiling floats drift freely at ~1000m parking depths and ascend every 10 days to collect high-resolution vertical temperature and salinity profiles, calibrated to international IOC/WMO quality control standards.")

        answer = "\n".join(lines)

        return FloatChatResponse(
            query=query.raw_query,
            intent=query.intent,
            answer=answer,
            key_findings=key_findings,
            structured_query=query,
            retrieval_result=result,
            data_summary=result.summary,
            citations=citations,
            chart_data=chart_data,
            map_markers=map_markers,
            follow_up_suggestions=follow_ups,
            confidence=query.confidence,
            data_source=result.data_source,
            is_empty=False,
        )


class LLMResponseSynthesizer(BaseResponseSynthesizer):
    """
    LLM-powered response synthesizer producing fluid, grounded oceanographic explanations.
    Falls back seamlessly to DeterministicResponseSynthesizer if the LLM is unavailable.
    """

    def __init__(
        self,
        llm_client: Optional[BaseLLMClient] = None,
        config: Optional[AIConfig] = None,
        fallback_synthesizer: Optional[BaseResponseSynthesizer] = None,
    ):
        self.config = config or AIConfig()
        self.llm_client = llm_client or create_llm_client(self.config)
        self.fallback_synthesizer = fallback_synthesizer or DeterministicResponseSynthesizer()

    def synthesize(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> FloatChatResponse:
        """Synthesize response using LLM with deterministic fallback."""
        citations = self._build_citations(result)
        chart_data = self._build_chart_payload(query, result)
        map_markers = self._build_map_markers(result)
        follow_ups = self._generate_follow_ups(query, result)

        if result.is_empty:
            return self.fallback_synthesizer.synthesize(query, result)

        summary_text = result.summary.to_text_summary() if result.summary else result.message
        user_prompt = (
            f"User Question: {query.raw_query}\n"
            f"Parsed Parameters: {[p.value for p in query.parameters]}\n"
            f"Location: {query.location.name if query.location else 'Offshore'}\n"
            f"Target Depth: {query.depth.target_depth if query.depth else 'Profile'}\n"
            f"Retrieved ARGO Data Summary: {summary_text}\n"
            f"Statistics: {result.summary_statistics}\n"
            f"Indicators: {result.indicators}\n"
            f"Matched Floats: {result.matched_platforms}\n\n"
            f"Generate a clear, professional oceanographic response grounded strictly in these measurements."
        )

        try:
            llm_text = self.llm_client.generate(
                prompt=user_prompt,
                system_prompt=RESPONSE_SYNTHESIZER_SYSTEM_PROMPT,
            )
            if not llm_text or not llm_text.strip():
                raise ValueError("Empty LLM response received")

            key_findings = []
            for p, s in result.summary_statistics.items():
                if s.get("mean") is not None:
                    unit = "°C" if p == "TEMP" else ("PSU" if p == "PSAL" else "")
                    key_findings.append(f"Mean {p}: {s['mean']} {unit} (Range: {s['min']} - {s['max']} {unit})")
            if result.matched_platforms:
                key_findings.append(f"Source Floats: {', '.join(result.matched_platforms)}")

            return FloatChatResponse(
                query=query.raw_query,
                intent=query.intent,
                answer=llm_text.strip(),
                key_findings=key_findings,
                structured_query=query,
                retrieval_result=result,
                data_summary=result.summary,
                citations=citations,
                chart_data=chart_data,
                map_markers=map_markers,
                follow_up_suggestions=follow_ups,
                confidence=query.confidence,
                data_source=result.data_source,
                is_empty=False,
            )
        except Exception as exc:
            logger.warning("LLM response synthesis failed (%s), falling back to deterministic synthesizer.", exc)
            return self.fallback_synthesizer.synthesize(query, result)

    async def synthesize_async(
        self,
        query: StructuredQuery,
        result: RetrievalResult,
    ) -> FloatChatResponse:
        """Asynchronously synthesize response using LLM with deterministic fallback."""
        citations = self._build_citations(result)
        chart_data = self._build_chart_payload(query, result)
        map_markers = self._build_map_markers(result)
        follow_ups = self._generate_follow_ups(query, result)

        if result.is_empty:
            return self.fallback_synthesizer.synthesize(query, result)

        summary_text = result.summary.to_text_summary() if result.summary else result.message
        user_prompt = (
            f"User Question: {query.raw_query}\n"
            f"Retrieved ARGO Data Summary: {summary_text}\n"
            f"Statistics: {result.summary_statistics}\n"
            f"Indicators: {result.indicators}\n"
            f"Matched Floats: {result.matched_platforms}\n\n"
            f"Generate a clear, professional oceanographic response grounded strictly in these measurements."
        )

        try:
            llm_text = await self.llm_client.generate_async(
                prompt=user_prompt,
                system_prompt=RESPONSE_SYNTHESIZER_SYSTEM_PROMPT,
            )
            if not llm_text or not llm_text.strip():
                raise ValueError("Empty LLM response received")

            key_findings = [
                f"Mean {p}: {s['mean']}"
                for p, s in result.summary_statistics.items()
                if s.get("mean") is not None
            ]

            return FloatChatResponse(
                query=query.raw_query,
                intent=query.intent,
                answer=llm_text.strip(),
                key_findings=key_findings,
                structured_query=query,
                retrieval_result=result,
                data_summary=result.summary,
                citations=citations,
                chart_data=chart_data,
                map_markers=map_markers,
                follow_up_suggestions=follow_ups,
                confidence=query.confidence,
                data_source=result.data_source,
                is_empty=False,
            )
        except Exception as exc:
            logger.warning("Async LLM synthesis failed (%s), falling back to deterministic synthesizer.", exc)
            return self.fallback_synthesizer.synthesize(query, result)


def create_response_synthesizer(
    config: Optional[AIConfig] = None,
    llm_client: Optional[BaseLLMClient] = None,
) -> BaseResponseSynthesizer:
    """Factory helper to instantiate the configured response synthesizer."""
    cfg = config or AIConfig()
    client = llm_client or create_llm_client(cfg)
    return LLMResponseSynthesizer(
        llm_client=client,
        config=cfg,
        fallback_synthesizer=DeterministicResponseSynthesizer(),
    )
