# FloatChat ARGO Data Retrieval & Integration Layer Documentation

## 1. Architecture Overview

The FloatChat Data Layer bridges the Natural Language Understanding (AI Layer) with oceanographic ARGO float datasets. It decouples query parsing from underlying data storage formats, supporting deterministic mock data for local testing as well as production-ready providers for **NetCDF files**, **Apache Parquet**, and **Remote Argovis/ERDDAP REST APIs**.

```
┌────────────────────────────────────────────────────────┐
│  User Query (Natural Language)                         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  AI Query Parser (Deterministic / LLM)                 │
└───────────────────────────┬────────────────────────────┘
                            │ StructuredQuery
                            ▼
┌────────────────────────────────────────────────────────┐
│  Data Retriever (ArgoDataRetriever)                    │
│  data.query_engine.ArgoDataRetriever                   │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│ SampleArgoProvider            │       │ Real ARGO Providers           │
│ (Deterministic Mock Data)     │       │ - NetCDFArgoProvider (*.nc)   │
│                               │       │ - ParquetArgoProvider (*.pq)  │
│                               │       │ - ArgovisRESTProvider (API)   │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                └───────────────────┬───────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────┐
│  Data Normalization & Sanitization                     │
│  (data.normalization.normalize_observation_dict)       │
│  - Rejects NaN, Inf, and FillValues (99999.0)          │
│  - Extracts and standardizes QC flags (1, 2, 3)        │
│  - Epoch conversion from JULD (1950-01-01)             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  Filtering & Spatial Matching (data.filters)           │
│  - Coarse Bounding Box Pushdown Filter                 │
│  - Geodesic Distance via Haversine Formula             │
│  - Vertical Depth Matching (Exact ± Tol / Range)       │
│  - Temporal Windowing (Date / Month / Relative)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  DataSummary Generator (data.filters)                  │
│  - Computes min/max/mean Temperature & Salinity        │
│  - Computes depth & temporal bounds                    │
│  - Extracts active platform WMO IDs                    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  RetrievalResult Output                                │
│  - Matched Observations (ArgoObservation)              │
│  - Authoritative DataSummary                           │
│  - Spatial, Depth, and Temporal Metadata               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  FastAPI Backend / LLM Response Synthesizer            │
└───────────────────────────┬────────────────────────────┘
```

---

## 2. Decoupled Pipeline Flow

The responsibilities in FloatChat are strictly decoupled:

$$\text{User Query} \xrightarrow{\text{AI Parser}} \text{StructuredQuery} \xrightarrow{\text{DataRetriever}} \text{Observations} \xrightarrow{\text{Summarizer}} \text{DataSummary} \xrightarrow{\text{RetrievalResult}} \text{LLM Synthesizer}$$

1. **AI / Query Parsing (`ai.parser`):** Converts natural language into a strictly structured `StructuredQuery` schema with verified location coordinates.
2. **Data Retriever (`data.query_engine`):** Consumes `StructuredQuery` and queries the underlying `BaseArgoProvider` without knowing whether data originates from local NetCDF files, Parquet, or in-memory mocks.
3. **Data Normalization (`data.normalization`):** Standardizes incoming records into typed `ArgoObservation` records, eliminating provider-specific idiosyncrasies, Julian date arithmetic, or raw NetCDF multi-dimensional array shapes.
4. **Filtering & Quality Control (`data.filters`):**
   - Filters out bad sensor values (`QC == 4`) and missing data (`QC == 9`).
   - Applies great-circle geodesic distance calculations (**Haversine formula**).
   - Resolves depth levels within configurable tolerances ($\pm 20\text{m}$) or depth slices.
5. **Data Summarization (`data.models.DataSummary`):** Calculates authoritative mathematical statistics (`mean`, `min`, `max`, `std`, `count`) in Python so the downstream LLM never hallucinates or miscalculates basic numbers.
6. **Retrieval Result (`data.models.RetrievalResult`):** Encapsulates observation records, statistical summaries, platform IDs, and provenance information.

---

## 3. Data Providers

### 1. `SampleArgoProvider` (Default / Testing)
- In-memory deterministic dataset covering Bay of Bengal (`2903334`, `2903335`), Arabian Sea (`5906432`, `5906433`), and Mumbai offshore (`5906434`).
- Used by default in unit tests and CI pipelines to guarantee fast, 100% reproducible test runs with zero network dependencies.

### 2. `NetCDFArgoProvider`
- Ingests standard ARGO GDAC DAC profile NetCDF files (`*prof.nc`).
- Extracts metadata (`PLATFORM_NUMBER`, `CYCLE_NUMBER`, `LATITUDE`, `LONGITUDE`, `JULD`), core profiles (`PRES_ADJUSTED`, `TEMP_ADJUSTED`, `PSAL_ADJUSTED`, `DOXY_ADJUSTED`), and quality control matrices (`*_QC`).
- Gracefully handles missing files, directory trees, or uninstalled NetCDF libraries without crashing.

### 3. `ParquetArgoProvider`
- Fast columnar reader for indexed Parquet ARGO datasets.
- Implements pushdown predicate filtering for latitude and longitude bounding boxes to avoid reading unneeded partitions into memory.

### 4. `ArgovisRESTProvider`
- Real-time remote query client for the public Argovis API (`https://argovis-api.colorado.edu/data/argo`) and ERDDAP.
- Translates `StructuredQuery` criteria into spatial circular/bounding-box queries, depth ranges, and platform filters.
- Safely reads API keys from environment variables (`ARGOVIS_API_KEY`) and handles network timeouts/HTTP errors gracefully.

---

## 4. Configuration & Runtime Switching

Providers are configured via `DataConfig` or standard environment variables:

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ARGO_DATA_PROVIDER` | `sample` | Active data provider: `sample`, `netcdf`, `parquet`, `remote` |
| `ARGO_DATA_PATH` | `None` | Path to NetCDF directory/file or Parquet dataset file |
| `ARGOVIS_API_URL` | `https://argovis-api.colorado.edu/data/argo` | Base REST endpoint for remote ARGO API |
| `ARGOVIS_API_KEY` | `None` | Optional API key for remote Argovis access |

### Switching Providers Programmatically:
```python
from ai.engine import FloatChatAIEngine
from data.config import DataConfig

# Use local NetCDF dataset
engine_nc = FloatChatAIEngine(
    data_config=DataConfig(provider_type="netcdf", data_path="path/to/argo_profiles/")
)

# Use Parquet columnar dataset
engine_pq = FloatChatAIEngine(
    data_config=DataConfig(provider_type="parquet", data_path="data/argo_dataset.parquet")
)

# Use Remote Argovis REST API
engine_remote = FloatChatAIEngine(
    data_config=DataConfig(provider_type="remote")
)
```

---

## 5. ARGO Observation & Summary Schemas

### `ArgoObservation` Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `platform_id` | `str` | 7-digit ARGO float WMO identifier (e.g. `2903334`) |
| `cycle_number`| `int?` | Profile ascent index number |
| `latitude` | `float` | Observation latitude ($-90.0$ to $+90.0^\circ$) |
| `longitude` | `float` | Observation longitude ($-180.0$ to $+180.0^\circ$) |
| `timestamp` | `str` | ISO 8601 UTC timestamp (`YYYY-MM-DDTHH:MM:SSZ`) |
| `pressure_dbar`| `float` | In-situ hydrostatic pressure in decibars |
| `depth_m` | `float` | Observation depth in meters |
| `temp_c` | `float?` | In-situ Sea Temperature in °C (ITS-90) |
| `psal_psu` | `float?` | Practical Salinity in PSU (PSS-78) |
| `doxy_umol_kg`| `float?` | Dissolved Oxygen concentration in µmol/kg |
| `chla_mg_m3` | `float?` | Chlorophyll-A concentration in mg/m³ |
| `temp_qc` | `int` | Quality Flag: 1=Good, 2=Probably Good, 4=Bad, 9=Missing |
| `psal_qc` | `int` | Salinity Quality Flag |
| `distance_km` | `float?` | Distance in kilometers to query coordinate |
| `data_source` | `str` | Data provenance (`SAMPLE_TEST_DATASET`, `REAL_ARGO_NETCDF`, etc.) |

---

## 6. Limitations & Future Work

1. **Live Remote Network Auth:** When querying remote Argovis endpoints in production, set the `ARGOVIS_API_KEY` environment variable to ensure higher API rate limits.
2. **NetCDF Memory Overhead:** For multi-gigabyte global GDAC directories, `ParquetArgoProvider` or indexed spatial catalogs (e.g., DuckDB/BigQuery) provide optimal performance over raw single-file NetCDF scanning.
