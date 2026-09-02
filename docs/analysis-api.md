# FloatChat Scientific Analysis & Aggregation API Reference

The **Scientific Analysis and Aggregation Layer** computes statistical aggregations, vertical depth profile summaries, multi-float comparisons, and temporal trends over retrieved Argo ocean observations.

---

## 1. Data Pipeline Architecture

FloatChat strictly separates raw data, query filtering, and scientific calculation:

```
RAW ARGO OBSERVATION (ERDDAP / Mock GDAC)
        ↓
FILTERED OBSERVATIONS (ObservationQueryService: Geo/Depth/Time/Variable)
        ↓
CALCULATED / DERIVED RESULT (ScientificAnalysisService: Stats/Profile/Compare/Trend)
        ↓
AI INTELLIGENCE & USER INTERFACE
```

> **Scientific Integrity Standard**:
> - Calculations exclude NaNs and missing measurements.
> - Derived statistical results are explicitly tagged with provenance (`is_mock`, `data_source`, `float_ids`).
> - Calculated/derived values are **never** presented as raw Argo observations.

---

## 2. API Endpoints Overview

### `POST /api/v1/analysis/statistics`
Calculates basic numeric statistics (`mean`, `median`, `minimum`, `maximum`, `requested_count`, `valid_count`) over a target variable (`TEMP`, `PSAL`, `PRES`).

#### **Request Payload**
```json
{
  "query": {
    "latitude": 25.0,
    "longitude": -75.0,
    "radius_km": 200.0,
    "limit": 50
  },
  "target_variable": "TEMP"
}
```

#### **Response Schema**
```json
{
  "status": "success",
  "variable": "TEMP",
  "unit": "°C",
  "requested_count": 45,
  "valid_count": 45,
  "mean": 21.3456,
  "median": 21.2000,
  "minimum": 3.5000,
  "maximum": 28.5000,
  "float_ids": ["6902746"],
  "data_source": "erddap_ifremer",
  "is_mock": false
}
```

---

### `POST /api/v1/analysis/profile`
Generates an aggregated vertical depth profile ordered by depth/pressure levels without inventing missing values.

#### **Request Payload**
```json
{
  "query": {
    "float_id": "6902746",
    "limit": 50
  }
}
```

#### **Response Schema**
```json
{
  "status": "success",
  "float_id": "6902746",
  "timestamp": "2024-01-15T12:00:00+00:00",
  "latitude": 25.143,
  "longitude": -80.071,
  "profile_points": [
    {
      "depth_m": 2.98,
      "pressure_dbar": 3.0,
      "temperature": 29.018,
      "salinity": 36.304,
      "timestamp": "2024-01-15T12:00:00+00:00",
      "qc_flags": { "temp_qc": "1" }
    }
  ],
  "point_count": 1,
  "data_source": "erddap_ifremer",
  "is_mock": false
}
```

---

### `POST /api/v1/analysis/compare`
Compares measurements between two float platforms at depth-matched levels.

#### **Request Payload**
```json
{
  "float_id_a": "6902746",
  "float_id_b": "6902747",
  "target_variable": "PSAL",
  "depth_tolerance_m": 10.0
}
```

#### **Response Schema**
```json
{
  "status": "success",
  "float_id_a": "6902746",
  "float_id_b": "6902747",
  "variable": "PSAL",
  "unit": "PSU",
  "metric": "depth_matched_difference",
  "mean_difference": 0.1245,
  "max_difference": 0.3500,
  "min_difference": 0.0100,
  "matched_levels_count": 8,
  "data_source_a": "erddap_ifremer",
  "data_source_b": "erddap_ifremer",
  "is_mock": false
}
```

---

### `POST /api/v1/analysis/trend`
Evaluates chronological changes between earliest and latest observations over a time interval.

#### **Request Payload**
```json
{
  "query": {
    "float_id": "6902746",
    "start_time": "2023-01-01T00:00:00Z",
    "end_time": "2024-01-01T00:00:00Z"
  },
  "target_variable": "TEMP"
}
```

#### **Response Schema**
```json
{
  "status": "success",
  "variable": "TEMP",
  "unit": "°C",
  "start_time": "2023-01-05T00:00:00+00:00",
  "end_time": "2023-12-28T00:00:00+00:00",
  "start_value": 24.5000,
  "end_value": 26.1000,
  "absolute_change": 1.6000,
  "percentage_change": 6.53,
  "observation_count": 24,
  "float_ids": ["6902746"],
  "data_source": "erddap_ifremer",
  "is_mock": false
}
```

---

## 3. No-Data Handling

If no valid observations match the specified query constraints:
- `status` returns `"no_data"`.
- `valid_count` returns `0`.
- Scientific metric fields (`mean`, `median`, `minimum`, `maximum`, `absolute_change`) return `null`.
- **Zero is never returned as a calculated result when data is missing.**
