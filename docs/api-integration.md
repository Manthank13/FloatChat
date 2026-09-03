# FloatChat — Frontend API Integration & Contract Guide

This document describes the product-facing REST endpoints mounted at `/api/...`, providing direct contract alignment for the React + Vite frontend application. It bridges frontend UI components (Command Center, Risk Map, Evidence Slicer, OceanPulse) with FloatChat's observation query, analysis, and data layers.

---

## 1. Architectural Model & Routing

```
React Frontend (`http://localhost:5173`)
        │
        ├── POST /api/query (or /api/chat fallback)
        ├── GET  /api/floats
        ├── GET  /api/floats/{float_id}
        ├── GET  /api/floats/{float_id}/profile
        ├── GET  /api/fleet/status
        ├── GET  /api/ocean/compare
        └── GET  /api/health
        │
        ▼
FastAPI Layer (`app/api/frontend.py`)
        │
        ▼
FrontendAdapterService (`app/services/frontend_adapter.py`)
        │
        ├── ObservationQueryService (`app/services/query.py`)
        ├── ScientificAnalysisService (`app/services/analysis.py`)
        └── ArgoDataSource (`app/services/erddap.py` / `app/services/mock.py`)
```

> **Zero Breaking Changes to `/api/v1`**: All native backend endpoints under `/api/v1/...` (`/api/v1/auth`, `/api/v1/chat`, `/api/v1/saved-queries`, `/api/v1/preferences`, `/api/v1/analysis`, `/api/v1/argo`) remain 100% untouched and active.

---

## 2. Product-Facing Endpoints Reference

| Method | Endpoint | Summary | Auth | Data Source |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/query` | Natural-Language Climate & Ocean Query | Optional (Guest/User) | Argo GDAC / Analysis |
| `POST` | `/api/chat` | Chat Compatibility Fallback | Optional (Guest/User) | Argo GDAC / Analysis |
| `GET` | `/api/floats` | Fleet Locations & Directory | Public | Argo GDAC / ERDDAP |
| `GET` | `/api/floats/{float_id}` | Float Telemetry & Cycle Details | Public | Argo GDAC / ERDDAP |
| `GET` | `/api/floats/{float_id}/profile`| Vertical CTD Water Column Points | Public | Argo GDAC / Analysis |
| `GET` | `/api/fleet/status` | Regional Float Count & Status | Public | Argo GDAC / Registry |
| `GET` | `/api/ocean/compare` | Multi-Float / Regional Comparator | Public | Scientific Analysis |
| `GET` | `/api/health` | Product Health & Service Check | Public | System Liveness |

---

## 3. Detailed Endpoint Contracts

### 3.1 POST `/api/query` (Fallback: `POST /api/chat`)

Processes environmental and climate queries. Determines the relevant ocean basin, retrieves real in-situ observations from active Argo floats, computes surface thermal state and stratification metrics, and produces structured KPI cards, vertical profile points, bullet insights, and formatted Markdown text.

- **Authentication**: Optional. If a valid `Authorization: Bearer <token>` is included, user session context is maintained; otherwise processes in guest mode.
- **Request Schema**:
  ```json
  {
    "query": "What climate risks are emerging along the Bay of Bengal?",
    "conversation_id": "conv-49b00930-e9db",
    "context": {
      "preferred_region": "bay_of_bengal",
      "depth_limit_meters": 2000
    }
  }
  ```
- **Response Schema (`200 OK`)**:
  ```json
  {
    "query": "What climate risks are emerging along the Bay of Bengal?",
    "location": {
      "name": "Bay of Bengal (Off Chennai)",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "regionCategory": "bay_of_bengal"
    },
    "float": {
      "id": "ARGO-2902741",
      "wmoNumber": "2902741",
      "name": "Argo Float 2902741",
      "institution": "Euro-Argo GDAC",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "cycle": 42,
      "timestamp": "2026-09-02T05:45:00Z",
      "lastTransmission": "Recent",
      "status": "Active"
    },
    "summary": {
      "surface_salinity": 33.1,
      "surface_temperature": 28.4,
      "deep_temperature": 3.1,
      "mixed_layer_depth": 35.0,
      "thermocline_depth": 110.0,
      "max_depth": 2000.0
    },
    "kpis": [
      {
        "label": "SEA SURFACE TEMPERATURE",
        "value": "28.4 °C",
        "anomaly": "Threshold: >28°C (Elevated Thermal State)",
        "riskRelevance": "Elevated upper ocean temperature reservoir",
        "riskLevel": "elevated",
        "type": "temp",
        "icon": "Thermometer"
      },
      {
        "label": "SURFACE SALINITY",
        "value": "33.1 PSU",
        "anomaly": "Surface Dilution (<34 PSU)",
        "riskRelevance": "Halocline barrier layer limiting vertical heat transfer",
        "riskLevel": "moderate",
        "type": "salinity",
        "icon": "Droplets"
      },
      {
        "label": "MIXED LAYER DEPTH (MLD)",
        "value": "35 meters",
        "anomaly": "Derived from in-situ vertical profile (ΔT=0.2°C)",
        "riskRelevance": "Shallow mixed layer capping subsurface heat",
        "riskLevel": "moderate",
        "type": "depth",
        "icon": "Layers"
      },
      {
        "label": "EVIDENCE QUALITY",
        "value": "RTQC PASS",
        "anomaly": "RTQC PASS (Good Data - Flag 1)",
        "riskRelevance": "Float #2902741",
        "riskLevel": "nominal",
        "type": "float",
        "icon": "Activity"
      }
    ],
    "profile": [
      {
        "depth": 0.0,
        "temperature": 28.4,
        "salinity": 33.1,
        "pressure": 0.0,
        "density": null,
        "oxygen": null
      }
    ],
    "insights": [
      "Surface thermal state: 28.4 °C (+0.8°C Anomaly (Elevated)) indicates upper ocean heat reservoir.",
      "Halocline barrier layer detected near 35m, acting as a physical cap that limits vertical heat loss.",
      "Risk-relevant indicator: Observed conditions support elevated thermal potential in this oceanic basin."
    ],
    "text": "### Observation & Environmental Signals: Bay of Bengal (Off Chennai)...",
    "source": {
      "dataset": "ARGO GDAC / INCOIS",
      "quality": "RTQC PASS",
      "cycle": 142
    },
    "followUps": [
      "Explain the environmental factors relevant to storm risk in Bay of Bengal (Off Chennai)",
      "What evidence suggests increased barrier layer thermal capping?",
      "Compare environmental conditions between the Arabian Sea and Bay of Bengal"
    ]
  }
  ```

---

### 3.2 GET `/api/floats`

Returns available float locations and metadata for interactive risk map markers.

- **Query Parameters**:
  - `region` (string, optional, default `"all"`): `"bay_of_bengal"`, `"arabian_sea"`, `"equatorial_indian_ocean"`, `"all"`.
  - `status` (string, optional, default `"all"`): `"active"`, `"profiling"`, `"surface_uplink"`, `"all"`.
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": "ARGO-IN-2902741",
      "wmoNumber": "2902741",
      "name": "Apex-741",
      "institution": "INCOIS / Euro-Argo GDAC",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "cycle": 142,
      "timestamp": "2026-09-02T05:45:00Z",
      "status": "Active",
      "region": "bay_of_bengal",
      "is_mock": false,
      "data_source": "erddap_ifremer"
    }
  ]
  ```

---

### 3.3 GET `/api/floats/{float_id}`

Retrieves metadata, cycle information, and operational state for a specific float.

- **Path Parameters**: `float_id` (e.g. `2902741` or `ARGO-IN-2902741`).
- **Response (`200 OK`)**:
  ```json
  {
    "id": "ARGO-IN-2902741",
    "wmoNumber": "2902741",
    "name": "Apex-741",
    "institution": "INCOIS / Euro-Argo GDAC",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "cycle": 142,
    "timestamp": "2026-09-02T05:45:00Z",
    "status": "Active",
    "region": "bay_of_bengal",
    "total_profiles": 42,
    "trajectory": [],
    "provenance": {
      "data_source": "erddap_ifremer",
      "is_mock": false,
      "quality_control": "RTQC PASS"
    }
  }
  ```
- **Error**: `404 Not Found` if float is not in registry.

---

### 3.4 GET `/api/floats/{float_id}/profile`

Returns vertical CTD observations (depth, temperature, salinity, pressure) for dynamic water column visualization.

- **Path Parameters**: `float_id` (e.g. `2902741`).
- **Response (`200 OK`)**:
  ```json
  {
    "float_id": "2902741",
    "timestamp": "2026-09-02T05:45:00Z",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "profile": [
      {
        "depth": 0.0,
        "temperature": 28.45,
        "salinity": 33.12,
        "pressure": 0.0,
        "density": null,
        "oxygen": null
      },
      {
        "depth": 49.7,
        "temperature": 26.81,
        "salinity": 34.20,
        "pressure": 50.0,
        "density": null,
        "oxygen": null
      }
    ],
    "point_count": 2,
    "data_source": "erddap_ifremer"
  }
  ```
- **Error**: `404 Not Found` if float has no profile observations.

---

### 3.5 GET `/api/fleet/status`

Summarizes active observation counts across geographic basins.

- **Response (`200 OK`)**:
  ```json
  {
    "total_floats": 6,
    "active_floats": 6,
    "regions": {
      "bay_of_bengal": 2,
      "arabian_sea": 2,
      "equatorial_indian_ocean": 2
    },
    "variables_supported": ["TEMP", "PSAL", "PRES"],
    "data_source": "erddap_ifremer",
    "last_updated": "2026-09-03T10:55:00Z"
  }
  ```

---

### 3.6 GET `/api/ocean/compare`

Compares water column measurements between two floats or regional basins.

- **Query Parameters**:
  - `float_id_a` / `float_id_b`: Specific float identifiers (optional).
  - `region_a` / `region_b`: Regional basin identifiers (`bay_of_bengal`, `arabian_sea`, etc.).
  - `variable`: `TEMP`, `PSAL`, or `PRES` (default `TEMP`).
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "target_a": "Bay of Bengal (Off Chennai)",
    "target_b": "Arabian Sea (Central Basin)",
    "variable": "TEMP",
    "unit": "°C",
    "metrics": [
      {
        "metric": "Mean Value",
        "value_a": 27.84,
        "value_b": 26.12,
        "difference": 1.72,
        "unit": "°C"
      }
    ],
    "depth_comparison": [],
    "summary": "Regional comparison between Bay of Bengal and Arabian Sea shows TEMP averaging 27.84 °C in Bay of Bengal versus 26.12 °C in Arabian Sea."
  }
  ```

---

### 3.7 GET `/api/health`

Product health check verifying service status.

- **Response (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "service": "FloatChat Climate Intelligence API",
    "argo_data_source": "ErddapArgoDataSource",
    "argo_active_count": null
  }
  ```

---

## 4. Supported vs. Unsupported Fields Specification

In compliance with scientific rigor, FloatChat exposes only scientifically validated measurements:

| Field | Contract Status | Reason |
| :--- | :--- | :--- |
| `temperature` | **Fully Supported** | Core Argo CTD measurement (°C) |
| `salinity` | **Fully Supported** | Core Argo CTD measurement (PSU) |
| `pressure` / `depth` | **Fully Supported** | Core Argo sensor (dbar) & normalizer derivation ($d = 0.993 \times p$) |
| `density` | **Returned as `null`** | Not measured by standard Argo CTD; avoided to prevent unsupported synthetic approximations |
| `oxygen` | **Returned as `null`** | Dissolved oxygen requires specialized BGC-Argo floats not currently active in core query |
| `trajectory` | **Returned as `[]`** | Historical 10-day drift trajectory requires multi-cycle tracking not yet exposed in single-profile queries |

---

## 5. Scientific Safety & Language Guardrails

All generated texts, KPIs, and insights follow the scientific communication policy:
1. **No Disaster Forecasting**: Never assert that a cyclone will occur or that a disaster is guaranteed.
2. **Standard Vocabulary**: Responses use terms like *"risk-relevant signal"*, *"environmental indicator"*, *"elevated thermal conditions"*, *"observed anomaly"*, and *"upper-ocean heat reservoir"*.
3. **Observation-First Pipeline**: Data moves from **OBSERVATION** $\rightarrow$ **ANALYSIS** $\rightarrow$ **ENVIRONMENTAL INTERPRETATION**.
