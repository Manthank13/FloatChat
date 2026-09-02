# FloatChat Oceanographic Query API Reference

The **Oceanographic Query Layer** provides endpoints to query, filter, and discover ocean observations collected by Argo profiling floats based on first-class scientific variables, Haversine geographic radius, target depth levels, and temporal intervals.

---

## 1. Supported First-Class Variables

| Variable Code | Oceanographic Parameter | Standard Units |
| :--- | :--- | :--- |
| `TEMP` | Sea Water Temperature | Degree Celsius (`°C`) |
| `PSAL` | Practical Salinity | Practical Salinity Unit (`PSU`) |
| `PRES` | Sea Water Pressure | Decibars (`dbar`) |

---

## 2. API Endpoints

### `POST /api/v1/observations/query` & `GET /api/v1/observations/query`
Executes a composable observation query using JSON payload (POST) or URL query parameters (GET).

#### **Query Parameters / Fields**
- `latitude` (`float`, optional): Search center latitude in degrees (`-90.0` to `90.0`).
- `longitude` (`float`, optional): Search center longitude in degrees (`-180.0` to `180.0`).
- `radius_km` (`float`, optional, default `100.0` if lat/lon provided): Search radius in kilometers (`> 0`).
- `variable` (`string` or `list`, optional): Variable filter (`TEMP`, `PSAL`, `PRES` or comma-separated).
- `depth_m` (`float`, optional): Target depth level in meters (`>= 0`). Matches nearest observation level.
- `depth_min_m` (`float`, optional): Minimum depth bound in meters (`>= 0`).
- `depth_max_m` (`float`, optional): Maximum depth bound in meters (`>= 0`).
- `start_time` (`ISO 8601 string`, optional): Start date UTC timestamp.
- `end_time` (`ISO 8601 string`, optional): End date UTC timestamp.
- `float_id` (`string`, optional): Target float platform WMO ID filter.
- `limit` (`int`, default `50`): Maximum results to return (`1` to `500`).

---

### `GET /api/v1/observations/nearby`
Convenience endpoint for spatial observation discovery around a point.
- **Parameters**: `latitude`, `longitude`, `radius_km` (default `100.0`), `variable`, `depth_m`, `limit`.

---

### `GET /api/v1/floats/nearby`
Discovers active float platforms operating near a coordinate point.
- **Parameters**: `latitude`, `longitude`, `radius_km` (default `200.0`), `limit` (default `10`).

---

## 3. Query Response Schema

```json
{
  "query": {
    "latitude": 13.0827,
    "longitude": 80.2707,
    "radius_km": 300.0,
    "variable": ["PSAL"],
    "depth_m": 100.0,
    "limit": 50
  },
  "results": [
    {
      "float_id": "6902746",
      "variable": "PSAL",
      "value": 35.464,
      "unit": "PSU",
      "latitude": 13.15,
      "longitude": 80.42,
      "timestamp": "2024-01-15T12:00:00+00:00",
      "depth_m": 99.3,
      "pressure_dbar": 100.0,
      "distance_km": 17.85,
      "requested_depth_m": 100.0,
      "actual_depth_m": 99.3,
      "depth_difference_m": 0.7,
      "qc_flags": { "psal_qc": "1" },
      "data_source": "erddap_ifremer",
      "is_mock": false
    }
  ],
  "count": 1,
  "metadata": {
    "data_provider": "erddap_ifremer",
    "total_candidates_evaluated": 12,
    "results_returned": 1
  }
}
```

---

## 4. Specific Example Queries

### Example 1: Floats Near Chennai
Discover float platforms operating within 300 km of Chennai (`Lat 13.0827°, Lon 80.2707°`):
```http
GET /api/v1/floats/nearby?latitude=13.0827&longitude=80.2707&radius_km=300
```

### Example 2: Salinity Near a Coordinate
Retrieve practical salinity (`PSAL`) observations within 150 km of a position:
```http
GET /api/v1/observations/nearby?latitude=25.0&longitude=-75.0&radius_km=150&variable=PSAL
```

### Example 3: Temperature Around 100m Depth
Query sea water temperature (`TEMP`) near target depth 100 meters:
```http
GET /api/v1/observations/query?variable=TEMP&depth_m=100
```

### Example 4: Observations During a Date Range
Retrieve observations collected between specified UTC timestamps:
```http
GET /api/v1/observations/query?start_time=2024-01-01T00:00:00Z&end_time=2024-01-31T23:59:59Z
```

### Example 5: Combined Geographic + Depth + Variable Query
Retrieve temperature (`TEMP`) observations within 200 km of `Lat 24.5°, Lon -84.0°` around `depth 50m`:
```http
POST /api/v1/observations/query
Content-Type: application/json

{
  "latitude": 24.5,
  "longitude": -84.0,
  "radius_km": 200.0,
  "variable": "TEMP",
  "depth_m": 50.0,
  "limit": 10
}
```
