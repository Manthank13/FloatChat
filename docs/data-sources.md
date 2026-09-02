# FloatChat Oceanographic Data Sources & Standardization

## 1. Overview: The ARGO Profiling Network

The international **ARGO Program** maintains a global array of ~4,000 autonomous robotic profiling floats. 
- **Drift Phase:** Floats drift at a parking depth of ~1,000 meters for ~10 days.
- **Ascent Phase:** Floats dive to 2,000 meters (or 6,000 meters for Deep Argo) and ascend to the surface, measuring physical and biogeochemical ocean properties.
- **Transmission Phase:** At the surface, floats transmit high-resolution vertical profile data via satellite telemetry to Global Data Assembly Centers (GDACs).

> **Core FloatChat Principle:**
> *ARGO provides authoritative environmental observations. FloatChat provides the conversational intelligence and analytical layer that enables users to query, interpret, and act on those observations.*

---

## 2. Supported Oceanographic Variables

FloatChat standardizes raw sensor columns into typed variables:

| Variable Code | Standard Description | Units | Physical Interpretation |
| :--- | :--- | :--- | :--- |
| `TEMP` | Sea Water Temperature | Degree Celsius (`°C`) | In-situ temperature measured on ITS-90 scale |
| `PSAL` | Practical Salinity | `PSU` | Salinity measured on the Practical Salinity Scale (PSS-78) |
| `PRES` | Hydrostatic Pressure | Decibars (`dbar`) | Sea water pressure ($1\text{ dbar} \approx 0.993\text{ meters depth}$) |
| `DOXY` | Dissolved Oxygen | `µmol/kg` | Dissolved oxygen concentration (BGC-Argo) |
| `CHLA` | Chlorophyll-A | `mg/m³` | Phytoplankton fluorescence proxy (BGC-Argo) |
| `NITRATE` | Nitrate Concentration | `µmol/kg` | Macronutrient concentration (BGC-Argo) |
| `PH_IN_SITU_TOTAL` | In-Situ Ocean pH | Total scale | Ocean acidification index |
| `BBP700` | Particle Backscattering | `m⁻¹` | Turbidity and particulate matter at 700nm |

---

## 3. IOC / WMO Quality Control (QC) Flags

Every measurement collected by an ARGO float undergoes rigorous quality control checks:

| Flag | Meaning | FloatChat Ingestion Action |
| :---: | :--- | :--- |
| **`1`** | **Good** (Passed all QC tests) | **Retained & Processed** |
| **`2`** | **Probably Good** (Minor correctable anomalies) | **Retained & Processed** |
| **`3`** | **Potentially Correctable** | **Retained & Processed** |
| **`4`** | **Bad Data** (Sensor malfunction / spike) | **Discarded / Sanitized** |
| **`5`** | **Value Changed** | Evaluated per parameter |
| **`8`** | **Interpolated Value** | Excluded from raw metrics |
| **`9`** | **Missing Value** / FillValue (`99999.0`) | **Discarded (Treated as null)** |

---

## 4. Supported Data Access Providers

FloatChat provides interchangeable access to multiple physical data storage formats via [`data.providers`](file:///c:/Users/Manthan/Documents/Dominion/FloatChat/data/providers/):

### 1. `SampleArgoProvider` (Default / CI / Offline Testing)
- In-memory deterministic dataset covering key Indian Ocean coastal and open-ocean sectors:
  - Western Bay of Bengal / Chennai (`Float 2903334`, `2903335`)
  - Arabian Sea / Kochi / Mumbai (`Float 5906432`, `5906433`, `5906434`)
- Guarantees 100% reproducible tests without network access or external keys.

### 2. `NetCDFArgoProvider`
- Ingests standard ARGO GDAC DAC profile NetCDF files (`*prof.nc`).
- Automatically extracts multidimensional arrays (`PRES_ADJUSTED`, `TEMP_ADJUSTED`, `PSAL_ADJUSTED`), converts Julian days (`JULD`) to ISO UTC timestamps, and extracts QC matrices.

### 3. `ParquetArgoProvider`
- Columnar Apache Parquet reader optimized for partitioned multi-gigabyte historical ARGO archives.
- Pushes down spatial bounding box filters directly to storage.

### 4. `ArgovisRESTProvider` / ERDDAP
- Real-time client querying public Argovis v3 endpoints (`https://argovis-api.colorado.edu/data/argo`) and NOAA/IFREMER ERDDAP servers.
- Translates structured query bounds into geographic circles, polygons, and depth intervals.
