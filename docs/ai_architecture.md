# FloatChat AI Layer & Architecture Documentation

## 1. System Overview

FloatChat is an AI-powered conversational system designed for exploring oceanographic ARGO float datasets. The AI + Data layer provides:
1. **Natural Language Query Interpretation:** Interpreting complex, free-form oceanographic questions into structured `StructuredQuery` schemas without hallucinating unverified coordinates.
2. **Multi-Format ARGO Data Access:** Decoupled data access across **Sample In-Memory**, **GDAC NetCDF (`*.nc`)**, **Apache Parquet (`*.parquet`)**, and **Remote Argovis/ERDDAP REST APIs**.
3. **Quality-Controlled Filtering & Authoritative Summaries:** Geodesic Haversine filtering, depth tolerances, temporal windowing, and pure-Python statistical summarization.
4. **Grounded Scientific Response Generation:** Transforming retrieved data into natural-language explanations, key findings, float platform citations, map markers, and depth-profile chart payloads.

```
┌─────────────────────────────────────────────────────────────┐
│ User Query (Natural Language)                               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ AI Query Parser (ai.parser.LLMQueryParser)                  │
│ - LLM Interpretation with Gemini / Mock Provider            │
│ - Fallback to Deterministic Regex & Coordinate Dictionary   │
└──────────────────────────────┬──────────────────────────────┘
                               │ StructuredQuery
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ ARGO Data Retriever (data.query_engine.ArgoDataRetriever)   │
│ - Coarse Bounding Box Filter Pushdown                       │
│ - Active Provider (Sample, NetCDF, Parquet, Argovis REST)   │
│ - Data Normalization (NaN / 99999.0 FillValue Sanitization) │
│ - IOC/WMO QC Filtering (Flags 1, 2, 3)                      │
│ - Geodesic Distance via Haversine Formula                   │
│ - Vertical Depth & Temporal Matching                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ RetrievalResult + DataSummary
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Response Synthesizer (ai.synthesizer.LLMResponseSynthesizer)│
│ - Scientific Natural Language Explanation                   │
│ - Authoritative Key Findings (Mean, Min, Max, Count)        │
│ - ARGO Float Citations & Data Provenance                    │
│ - Frontend Chart Payloads (Depth vs Parameter Points)       │
│ - Frontend Map Markers (Coordinates & Float IDs)            │
│ - Follow-Up Oceanographic Exploration Suggestions           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FloatChatResponse (ai.response_models.FloatChatResponse)    │
│ - Consumed by FastAPI Backend Router & Frontend Web UI      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Pipeline

### A. Query Interpretation (`ai/parser.py`, `ai/models.py`)
- **`StructuredQuery`**: Strongly typed Pydantic schema with query intent, parameter codes (`TEMP`, `PSAL`, `DOXY`, `PRES`, `CHLA`, `NITRATE`), location bounds, depth targets/slices, and time windows.
- **`LLMQueryParser`**: Translates natural language to JSON adhering to `QUERY_INTERPRETER_SYSTEM_PROMPT`.
- **`DeterministicQueryParser`**: Fallback parser matching regex patterns and the reference coordinate dictionary `KNOWN_OCEAN_LOCATIONS`.

### B. ARGO Retrieval Engine (`data/query_engine.py`, `data/providers/`)
- **`BaseArgoProvider`**: Common abstract interface for loading observations and vertical profiles.
- **`SampleArgoProvider`**: Deterministic reference dataset of the Indian Ocean (Chennai `2903334`, Bay of Bengal `2903335`, Kochi `5906432`, Central Arabian Sea `5906433`, Mumbai `5906434`).
- **`NetCDFArgoProvider`**: Real NetCDF parser reading standard ARGO GDAC `*prof.nc` files with Julian day epoch conversion and QC extraction.
- **`ParquetArgoProvider`**: Columnar reader with pushdown predicate filtering for bounding boxes.
- **`ArgovisRESTProvider`**: HTTP client for querying live global ARGO profiles via public Argovis / ERDDAP APIs.
- **`normalize_observation_dict`**: Cleans sensor values, removes `99999.0` sentinel values and NaNs, converts Julian days (JULD) relative to 1950-01-01 UTC.

### C. Response Synthesis (`ai/synthesizer.py`, `ai/response_models.py`)
- **`FloatChatResponse`**:
  - `answer`: Markdown narrative explaining measurements, physical context (e.g., salinity barrier layers, thermoclines, upwelling).
  - `key_findings`: List of core mathematical statistics.
  - `citations`: List of `FloatCitation` objects containing float WMO ID, cycle number, coordinates, timestamp, distance in km.
  - `chart_data`: `ChartDataPayload` containing ordered depth vs parameter points for frontend charting.
  - `map_markers`: `MapMarker` coordinates for rendering active float positions on frontend maps.
  - `follow_up_suggestions`: Recommended next oceanographic questions.
- **`DeterministicResponseSynthesizer`**: Rule-based template generator guaranteeing 100% groundedness and zero hallucinations.
- **`LLMResponseSynthesizer`**: Generates fluid scientific explanations grounded strictly in the computed `DataSummary`, with automatic fallback to the deterministic synthesizer if API calls fail or timeout.

---

## 3. High-Level Engine API

The `FloatChatAIEngine` coordinates the entire pipeline:

```python
from ai.engine import FloatChatAIEngine
from ai.config import AIConfig
from data.config import DataConfig

# Initialize engine (with optional LLM or Data configuration)
engine = FloatChatAIEngine(
    config=AIConfig(llm_provider="mock"),
    data_config=DataConfig(provider_type="sample"),
)

# 1. Full Conversational Chat
response = engine.chat("What is the salinity near Chennai at 100 meters?")
print(response.answer)
print(response.citations)
print(response.chart_data)
print(response.map_markers)

# 2. JSON Export for FastAPI Backend
backend_payload = response.to_backend_dict()
```

---

## 4. Configuration & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | `mock` | LLM provider: `mock`, `gemini` |
| `GEMINI_API_KEY` | `None` | Google Gemini API Key |
| `ARGO_DATA_PROVIDER` | `sample` | Data provider: `sample`, `netcdf`, `parquet`, `remote` |
| `ARGO_DATA_PATH` | `None` | Path to NetCDF directory or Parquet dataset file |
| `ARGOVIS_API_URL` | `https://argovis-api.colorado.edu/data/argo` | Base REST URL for live ARGO queries |
| `ARGOVIS_API_KEY` | `None` | Optional API key for Argovis REST access |
