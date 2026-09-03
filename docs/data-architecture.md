# FloatChat Argo Ocean Data Architecture

This document describes the design, retrieval methodology, normalization pipeline, data quality standards, and mock fallback system for FloatChat's Argo oceanographic data layer.

---

## 1. Argo Data Source

FloatChat retrieves real, publicly available oceanographic observations from the **Euro-Argo Global Data Assembly Centre (GDAC) ERDDAP service**:

- **Service URL**: `https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json`
- **Provider Identifier**: `erddap_ifremer`
- **Data Description**: The Global Argo Array consists of over 3,800 autonomous profiling floats measuring sea temperature (TEMP), practical salinity (PSAL), and pressure (PRES) from the surface down to 2,000 meters.

---

## 2. Retrieval Method

Data access is performed asynchronously using `httpx` against the ERDDAP RESTful `tabledap` JSON interface:

1. **Selective Querying**: Queries target specific variables (`platform_number`, `cycle_number`, `time`, `latitude`, `longitude`, `pres`, `temp`, `psal`, `pres_qc`, `temp_qc`, `psal_qc`) to prevent downloading massive global dataset files.
2. **Filtering**: Supports spatial bounding boxes (`latitude`, `longitude`), temporal constraints (`time`), and float platform IDs (`platform_number`).
3. **Timeouts & Safety**: Enforces a strict default HTTP request timeout (15 seconds) and record limit (e.g. 500 records max per query) to keep response times fast for real-time web use.

---

## 3. Internal Data Models

FloatChat abstracts raw provider JSON responses into strict internal Pydantic domain models located in `app/models/argo.py`:

### `FloatMetadata`
- `float_id`: Unique platform identifier (WMO ID string).
- `last_latitude` / `last_longitude`: Latest reported coordinates.
- `last_timestamp`: UTC datetime of the latest profile.
- `cycle_number`: Latest profile cycle number.
- `total_profiles`: Total profiles retrieved.
- `is_mock`: Boolean flag identifying synthetic vs real observations.
- `data_source`: Provider identifier (`"erddap_ifremer"` or `"mock"`).

### `Profile`
- `float_id`: Platform WMO ID.
- `cycle_number`: Profile dive cycle index.
- `timestamp`: Profile UTC timestamp.
- `latitude` / `longitude`: Profile geographic position.
- `observations`: Ordered list of vertical level `Observation` objects.
- `observation_count`: Total valid observations in profile.
- `is_mock` / `data_source`: Scientific origin provenance fields.

### `Observation`
- `float_id`: Platform ID.
- `timestamp`: Observation UTC datetime.
- `latitude` / `longitude`: Geographic location (-90..90, -180..180).
- `pressure`: Sea water pressure in decibars (dbar).
- `depth`: Derived water depth in meters (m).
- `temperature`: Sea water temperature in °C (-5.0 to 40.0 °C).
- `salinity`: Practical salinity in PSU (0.0 to 50.0 PSU).
- `qc_flags`: Quality control flag mapping (`pres_qc`, `temp_qc`, `psal_qc`).
- `is_mock` / `data_source`: Provenance tracking.

---

## 4. Normalization Process

Raw ERDDAP JSON responses are passed through `ArgoNormalizer` in `app/services/normalizer.py`:

```
Raw Provider Response (ERDDAP JSON)
        ↓
Data Cleaning & Parsing (NaNs, Ocean Fill Values -> None)
        ↓
Validation (Coordinates, Physical Temp/Salinity Bounds)
        ↓
Depth Derivation (depth = pres * 0.993)
        ↓
Profile Grouping & Observation Level Deduplication
        ↓
Internal Pydantic Models (Profile / Observation)
```

---

## 5. Missing-Value & Quality Handling

FloatChat adheres strictly to the **Scientific Integrity Rule**:
> **Never invent missing scientific measurements or substitute fake values for raw observations.**

- **Missing Values**: String `"NaN"`, `"null"`, empty values, and standard oceanographic fill values (`99999.0`, `-9999.0`, `9999.0`) are parsed to Python `None`.
- **Invalid Coordinates**: Observations with latitude outside `[-90, 90]` or longitude outside `[-180, 180]` are discarded.
- **Physical Outliers**: Temperature values outside `[-5.0°C, 40.0°C]` or salinity values outside `[0.0, 50.0 PSU]` are set to `None`.
- **Deduplication**: Duplicate measurements sharing identical pressure/depth levels within the same profile dive cycle are merged.

---

## 6. Mock Provider (`MockArgoDataSource`)

For local offline development, unit testing, and fallback when network access is unavailable, FloatChat provides a `MockArgoDataSource` implementation in `app/services/mock.py`:

- **Synthetic Profile Generation**: Uses an ocean thermocline decay model ($T_{deep} + (T_{surf} - T_{deep}) \cdot e^{-pres / 200}$) to produce realistic temperature and salinity depth profiles.
- **Strict Mock Labeling**: Every synthetic record explicitly sets `is_mock = True` and `data_source = "mock"`.
- **No Confusion**: Synthetic/mock data is never presented as raw Argo observation data.

---

## 7. Configuration Options

Set in `.env` or environment variables (managed via `app/core/config.py`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATA_PROVIDER` | `"argo"` | Active provider: `"argo"` (real ERDDAP) or `"mock"` |
| `ARGO_BASE_URL` | `"https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.json"` | IFREMER ERDDAP tabledap endpoint |
| `ARGO_REQUEST_TIMEOUT` | `15.0` | HTTP network timeout in seconds |
| `ARGO_MAX_RECORDS` | `500` | Maximum records retrieved per query |

---

## 8. Limitations & Scope

1. **Subsampling**: High-frequency Argo data is queried with limits to optimize bandwidth and API responsiveness.
2. **Derivations**: Water depth is derived from pressure using standard sea pressure approximation ($1 \text{ dbar} \approx 0.993 \text{ m}$).
3. **Network Constraints**: If IFREMER ERDDAP is unreachable or times out, set `DATA_PROVIDER="mock"` to run full development workflows offline.
