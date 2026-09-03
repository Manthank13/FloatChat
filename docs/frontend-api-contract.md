# FloatChat — Climate Intelligence & Disaster Resilience API Contract

> **Target Audience**: FastAPI Backend Developer & AI/Climate Intelligence Engineer  
> **Author**: Frontend Lead (React + Vite)  
> **Core Mission**: Climate Intelligence & Disaster Resilience powered by in-situ environmental & ARGO observations.  
> **Base URL**: `http://localhost:8000` (Configured in frontend via `VITE_API_BASE_URL`)  
> **Mock Toggle**: Set `VITE_USE_MOCK_DATA=false` in `frontend/.env` to connect directly to the live FastAPI backend.

---

## 🏗️ 3-Tier System Architecture

```
┌──────────────────────────────────────────────┐
│        React Climate Frontend                │
│ (Command Center, Risk Map, Evidence Slicer)  │
└──────────────────────────────────────────────┘
                       │  ▲
           POST / GET  │  │  Normalized JSON
          HTTP REST    │  │  Response (200 OK)
                       ▼  │
┌──────────────────────────────────────────────┐
│        FastAPI Backend                       │
│  (Telemetry Cache, Spatial NetCDF Index)     │
└──────────────────────────────────────────────┘
                       │  ▲
       In-situ Profile │  │  Climate Risk Reasoning
       & Sensor Data   │  │  & Scientific Assessment
                       ▼  │
┌──────────────────────────────────────────────┐
│      AI & Climate Reasoning Engine           │
│   (Domain-Trained Environmental LLM)         │
└──────────────────────────────────────────────┘
```

---

## 📡 REST Endpoints Specification

### 1. Natural-Language Climate & Disaster Query

- **Endpoint**: `POST /api/query` (Fallback: `POST /api/chat`)
- **Method**: `POST`
- **Frontend Usage**: Triggered whenever the user enters a climate, disaster risk, or environmental question.
- **Frontend State Sequence**: `IDLE` $\rightarrow$ `SEARCHING` $\rightarrow$ `RETRIEVING` $\rightarrow$ `ANALYZING` $\rightarrow$ `SUCCESS` / `ERROR`.

#### Request JSON Schema:
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

#### Response JSON Schema (`200 OK`):
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
    "id": "ARGO-IN-2902741",
    "wmoNumber": "2902741",
    "name": "INCOIS-Apex-084",
    "institution": "INCOIS / MoES India",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "cycle": 142,
    "timestamp": "2026-09-02T05:45:00Z",
    "lastTransmission": "24 mins ago",
    "status": "Active"
  },

  "summary": {
    "surface_salinity": 33.1,
    "surface_temperature": 28.4,
    "deep_temperature": 3.1,
    "mixed_layer_depth": 35,
    "thermocline_depth": 110,
    "max_depth": 2000
  },

  "kpis": [
    {
      "label": "SEA SURFACE TEMPERATURE",
      "value": "28.4 °C",
      "anomaly": "+0.8°C Anomaly (Elevated)",
      "riskRelevance": "Elevated thermal fuel for tropical storms",
      "riskLevel": "elevated",
      "type": "temp",
      "icon": "Thermometer"
    },
    {
      "label": "SURFACE SALINITY",
      "value": "33.1 PSU",
      "anomaly": "-0.4 PSU vs 30yr Baseline",
      "riskRelevance": "Barrier layer inhibiting evaporative cooling",
      "riskLevel": "moderate",
      "type": "salinity",
      "icon": "Droplets"
    },
    {
      "label": "MIXED LAYER DEPTH (MLD)",
      "value": "35 meters",
      "anomaly": "Current Status: Stratified",
      "riskRelevance": "Shallow thermocline heat cap",
      "riskLevel": "moderate",
      "type": "depth",
      "icon": "Layers"
    },
    {
      "label": "EVIDENCE QUALITY",
      "value": "RTQC PASS",
      "anomaly": "WMO / INCOIS Calibrated",
      "riskRelevance": "Float #ARGO-IN-2902741",
      "riskLevel": "nominal",
      "type": "float",
      "icon": "Activity"
    }
  ],

  "profile": [
    { "depth": 0, "temperature": 28.4, "salinity": 33.1, "pressure": 0, "density": 21.2, "oxygen": 210 },
    { "depth": 50, "temperature": 26.8, "salinity": 34.2, "pressure": 50, "density": 22.4, "oxygen": 180 },
    { "depth": 2000, "temperature": 3.1, "salinity": 34.8, "pressure": 2000, "density": 27.8, "oxygen": 145 }
  ],

  "insights": [
    "Surface thermal state: 28.4 °C (+0.8°C anomaly) indicates elevated upper ocean heat content.",
    "Halocline barrier layer detected at 35m, acting as a physical cap that traps subsurface heat.",
    "Risk-relevant indicator: Observed conditions support elevated cyclone heat potential in the Bay of Bengal."
  ],

  "text": "### Observation & Environmental Signals: Bay of Bengal (Off Chennai)\n\nIn-situ telemetry from **ARGO Float ARGO-IN-2902741** (WMO: 2902741) reveals **Sea Surface Temperature (SST) at 28.40 °C** with **surface salinity at 33.10 PSU**.\n\n#### 1. Observation\n- **Surface Thermal State**: SST measured at 28.40 °C (+0.8°C above seasonal baseline).\n- **Salinity Stratification**: Surface salinity diluted to 33.10 PSU by river discharge.\n- **Mixed Layer Depth (MLD)**: Established at 35 meters.\n\n#### 2. Scientific Insight\n- **Halocline Barrier Layer**: A low-salinity surface layer caps the water column, preventing vertical mixing.\n- **Subsurface Heat Trapping**: Solar radiation stores thermal energy in the upper 50–100m without rapid evaporative cooling.\n\n#### 3. Climate Risk & Disaster Relevance\n- **Risk-Relevant Signal**: Elevated upper-ocean heat reservoir with barrier layer trapping.\n- **Cyclonic Fuel Potential**: High TCHP (>85 kJ/cm²) is an environmental indicator associated with storm intensification.\n\n#### 4. Observational Evidence\n- Ground-truth data verified via Seabird CTD sensors on Float **ARGO-IN-2902741** during Cycle #142.",

  "source": {
    "dataset": "ARGO GDAC / INCOIS",
    "quality": "RTQC PASS",
    "cycle": 142
  },

  "followUps": [
    "Explain the environmental factors relevant to cyclone risk in this region",
    "What evidence suggests increased coastal flood or barrier layer risk?",
    "Compare environmental conditions between the Arabian Sea and Bay of Bengal"
  ]
}
```

---

### 2. Climate Sensing Fleet Locations

- **Endpoint**: `GET /api/floats`
- **Method**: `GET`
- **Frontend Usage**: Renders interactive risk map markers and sensor fleet directory.
- **Query Parameters**:
  - `region`: `all` | `bay_of_bengal` | `arabian_sea` | `equatorial_indian_ocean`
  - `status`: `all` | `active` | `profiling` | `surface_uplink`

---

### 3. Individual Sensor Evidence & 10-Day Trajectory

- **Endpoint**: `GET /api/floats/{float_id}`
- **Method**: `GET`
- **Frontend Usage**: Populates the Float Inspection Drawer modal and trajectory drift lines.

---

### 4. CTD Vertical Ocean Heat & Stratification Profile

- **Endpoint**: `GET /api/floats/{float_id}/profile`
- **Method**: `GET`
- **Frontend Usage**: Renders dynamic SVG water column in `OceanSlice.jsx`.

---

### 5. Climate Signals & Regional Fleet Pulse

- **Endpoint**: `GET /api/fleet/status`
- **Method**: `GET`
- **Frontend Usage**: Powers `OceanPulse.jsx` environmental indicator widget.

---

### 6. Environmental Stratification & Heat Comparator

- **Endpoint**: `GET /api/ocean/compare`
- **Method**: `GET`
- **Frontend Usage**: Powers `/data` side-by-side water column slicer and variance matrix.

---

### 7. Health Check

- **Endpoint**: `GET /api/health`
- **Method**: `GET`
- **Response**: `{"status": "ok", "service": "FloatChat Climate Intelligence API", "argo_active_count": 3842}`

---

## 🛡️ Scientific Safety & Verification Guardrails

1. **No Unsupported Predictions**: The system reports **environmental indicators**, **thermal anomalies**, and **risk-relevant signals**, not guarantees of disasters.
2. **Standard Vocabulary**: Responses must use terminology like *"risk-relevant signal"*, *"environmental indicator"*, *"elevated conditions"*, *"observed anomaly"*.
