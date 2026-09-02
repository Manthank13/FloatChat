# FloatChat Unified API Reference

This document outlines the API endpoints, data models, authentication methods, and integration contracts for the FloatChat platform.

---

## 1. System Health Endpoint

### `GET /api/v1/health`
Returns the operational health and connectivity status of backend services and database connections.

- **Authentication:** None
- **Response Format:** JSON
- **Example Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "argo_provider": "operational"
}
```

---

## 2. Authentication & User Endpoints

### `POST /api/v1/auth/register`
Registers a new user account with secure password hashing (bcrypt).

- **Authentication:** None
- **Request Body:**
```json
{
  "email": "oceanographer@research.edu",
  "password": "SecurePassword123!",
  "full_name": "Dr. Sylvia Earle"
}
```
- **Response Format:**
```json
{
  "id": "65b8f1a23c4d5e6f7a8b9c0d",
  "email": "oceanographer@research.edu",
  "full_name": "Dr. Sylvia Earle",
  "is_active": true
}
```

### `POST /api/v1/auth/token`
Authenticates user credentials and issues an OAuth2 JWT Bearer access token.

- **Authentication:** None (Form Data / JSON)
- **Request Body:** `username` (email) and `password`
- **Response Format:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### `GET /api/v1/auth/me`
Returns the profile details of the currently authenticated user.

- **Authentication:** Bearer Token (`Authorization: Bearer <token>`)
- **Response Format:** User profile JSON object.

---

## 3. Oceanographic Observation Endpoints

### `POST /api/v1/observations/query` (also available via `GET`)
Executes composable spatial, vertical, and temporal filtering over quality-controlled ARGO observations.

- **Authentication:** None (or Optional Bearer Token)
- **Request Parameters / Body:**
  - `latitude` (`float`, optional): Center latitude (`-90.0` to `90.0`)
  - `longitude` (`float`, optional): Center longitude (`-180.0` to `180.0`)
  - `radius_km` (`float`, optional, default: `100.0`): Search radius in km
  - `variable` (`string` or `list`, optional): `TEMP`, `PSAL`, `PRES`, `DOXY`
  - `depth_m` (`float`, optional): Target depth level in meters
  - `depth_min_m` / `depth_max_m` (`float`, optional): Vertical depth range bounds
  - `start_time` / `end_time` (`string`, optional): ISO 8601 UTC timestamps
  - `float_id` (`string`, optional): 7-digit WMO platform identifier (e.g. `2903334`)
  - `limit` (`int`, default: `50`): Maximum records to return

- **Example Request:**
```http
POST /api/v1/observations/query
Content-Type: application/json

{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "radius_km": 50.0,
  "variable": "PSAL",
  "depth_m": 100.0
}
```

- **Example Response:**
```json
{
  "query": {
    "latitude": 13.0827,
    "longitude": 80.2707,
    "radius_km": 50.0,
    "variable": ["PSAL"],
    "depth_m": 100.0,
    "limit": 50
  },
  "results": [
    {
      "float_id": "2903334",
      "cycle_number": 42,
      "variable": "PSAL",
      "value": 34.78,
      "unit": "PSU",
      "latitude": 13.15,
      "longitude": 80.45,
      "timestamp": "2025-01-15T06:00:00Z",
      "depth_m": 99.3,
      "pressure_dbar": 100.0,
      "distance_km": 20.4,
      "qc_flags": { "psal_qc": "1" },
      "data_source": "SAMPLE_TEST_DATASET"
    }
  ],
  "count": 1,
  "metadata": {
    "data_provider": "sample_in_memory",
    "results_returned": 1
  }
}
```

### `GET /api/v1/observations/nearby`
Convenience endpoint for spatial observation discovery around a coordinate point.

### `GET /api/v1/floats/nearby`
Discovers active ARGO float platforms operating near a location.

---

## 4. Scientific Analysis Endpoints

### `POST /api/v1/analysis/statistics`
Calculates authoritative descriptive statistics (`mean`, `median`, `min`, `max`, `std`, observation counts) over retrieved observations.

- **Request Body:**
```json
{
  "query": {
    "latitude": 13.0827,
    "longitude": 80.2707,
    "radius_km": 100.0
  },
  "target_variable": "TEMP"
}
```
- **Response Format:**
```json
{
  "status": "success",
  "variable": "TEMP",
  "unit": "°C",
  "requested_count": 12,
  "valid_count": 12,
  "mean": 24.15,
  "median": 24.10,
  "minimum": 16.50,
  "maximum": 28.20,
  "float_ids": ["2903334"],
  "data_source": "SAMPLE_TEST_DATASET"
}
```

### `POST /api/v1/analysis/profile`
Aggregates and sorts vertical depth profile series for visualization.

### `POST /api/v1/analysis/compare`
Compares oceanographic variables between two float platforms or regional water masses.

### `POST /api/v1/analysis/trend`
Evaluates chronological changes between earliest and latest observations over a time interval.

---

## 5. AI Engine Conversational Contracts (`ai/engine.py`)

### Python Interface: `engine.chat(query: str) -> FloatChatResponse`
Transforms natural-language user queries into end-to-end responses with conversational answers, citations, chart points, and map markers.

- **Export Schema (`response.to_backend_dict()`):**
```json
{
  "query": "What is the salinity near Chennai at 100 meters?",
  "intent": "profile_query",
  "answer": "Near **Chennai** at a depth of **100 meters**, the practical salinity is **34.78 PSU**...",
  "key_findings": [
    "Mean PSAL: 34.815 PSU (Range: 34.78 - 34.85 PSU)",
    "Retrieved 2 observation levels across Float `2903334`"
  ],
  "citations": [
    {
      "platform_id": "2903334",
      "cycle_number": 42,
      "latitude": 13.15,
      "longitude": 80.45,
      "timestamp": "2025-01-15T06:00:00Z",
      "distance_km": 20.4
    }
  ],
  "chart_data": {
    "chart_type": "profile",
    "title": "Vertical PSAL Profile - Chennai",
    "parameter": "PSAL",
    "unit": "PSU",
    "data_points": [
      {
        "depth_m": 100.0,
        "value": 34.78,
        "parameter": "PSAL",
        "platform_id": "2903334",
        "timestamp": "2025-01-15T06:00:00Z"
      }
    ]
  },
  "map_markers": [
    {
      "latitude": 13.15,
      "longitude": 80.45,
      "platform_id": "2903334",
      "title": "ARGO Float 2903334",
      "description": "Active at lat: 13.15, lon: 80.45"
    }
  ],
  "follow_up_suggestions": [
    "How does salinity near Chennai compare between surface and 500m depth?",
    "Show temperature near Chennai across the same depth range."
  ],
  "confidence": 1.0,
  "is_empty": false
}
```
