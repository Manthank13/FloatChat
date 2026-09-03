/**
 * FloatChat Mock Dataset
 * Contains realistic ARGO float telemetry, CTD profiles, trajectory data,
 * and canned conversational responses for oceanographic queries.
 * NOTE: For hackathon demonstration. Easily replaced by FastAPI backend endpoints.
 */

export const ARGO_FLOATS = [
  {
    id: "ARGO-IN-2902741",
    wmoNumber: "2902741",
    name: "INCOIS-Apex-084",
    institution: "INCOIS / MoES India",
    region: "Bay of Bengal (Off Chennai)",
    regionCategory: "bay_of_bengal",
    lat: 13.0827,
    lng: 80.2707,
    status: "Active", // "Active" | "Profiling" | "Surface Uplink"
    cycleNumber: 142,
    lastTransmission: "24 mins ago",
    timestamp: "2026-09-02T05:45:00Z",
    surfaceTemp: 28.4, // °C
    deepTemp: 3.1, // °C at 2000m
    surfaceSalinity: 33.1, // PSU (Low due to Gangetic & Krishna-Godavari freshwater discharge)
    deepSalinity: 34.8, // PSU
    surfacePressure: 5.2, // dbar
    maxDepth: 2000, // m
    batteryPercent: 88,
    transmissionType: "Iridium SBD",
    sensors: ["CTD (Seabird SBE41CP)", "Optode 4330 (Dissolved O2)", "FLBB (Chlorophyll-a)"],
    mixedLayerDepth: 35, // m
    thermoclineDepth: 110, // m
    trajectory: [
      { lat: 12.65, lng: 80.95, cycle: 139, date: "1 month ago" },
      { lat: 12.82, lng: 80.65, cycle: 140, date: "20 days ago" },
      { lat: 12.96, lng: 80.45, cycle: 141, date: "10 days ago" },
      { lat: 13.0827, lng: 80.2707, cycle: 142, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 28.4, salinity: 33.1, oxygen: 210, density: 21.2 },
      { depth: 10, temp: 28.3, salinity: 33.2, oxygen: 208, density: 21.3 },
      { depth: 25, temp: 28.1, salinity: 33.5, oxygen: 205, density: 21.6 },
      { depth: 50, temp: 26.8, salinity: 34.2, oxygen: 180, density: 22.4 },
      { depth: 75, temp: 23.4, salinity: 34.7, oxygen: 135, density: 23.8 },
      { depth: 100, temp: 19.8, salinity: 34.9, oxygen: 95, density: 24.9 },
      { depth: 150, temp: 16.2, salinity: 35.0, oxygen: 60, density: 25.8 },
      { depth: 200, temp: 13.9, salinity: 35.0, oxygen: 42, density: 26.3 },
      { depth: 300, temp: 11.7, salinity: 35.0, oxygen: 35, density: 26.8 },
      { depth: 500, temp: 9.4, salinity: 35.0, oxygen: 38, density: 27.2 },
      { depth: 750, temp: 7.2, salinity: 34.9, oxygen: 55, density: 27.5 },
      { depth: 1000, temp: 5.8, salinity: 34.8, oxygen: 85, density: 27.6 },
      { depth: 1500, temp: 4.1, salinity: 34.8, oxygen: 120, density: 27.7 },
      { depth: 2000, temp: 3.1, salinity: 34.8, oxygen: 145, density: 27.8 }
    ]
  },
  {
    id: "ARGO-IN-2903118",
    wmoNumber: "2903118",
    name: "NIO-Provor-412",
    institution: "CSIR-NIO Goa",
    region: "Arabian Sea (Off Goa / Mumbai)",
    regionCategory: "arabian_sea",
    lat: 15.2993,
    lng: 71.8542,
    status: "Active",
    cycleNumber: 98,
    lastTransmission: "1 hour ago",
    timestamp: "2026-09-02T05:08:00Z",
    surfaceTemp: 29.1,
    deepTemp: 2.9,
    surfaceSalinity: 36.6, // High salinity due to high evaporation & Persian Gulf / Red Sea outflow
    deepSalinity: 34.7,
    surfacePressure: 4.8,
    maxDepth: 2000,
    batteryPercent: 92,
    transmissionType: "Iridium SBD",
    sensors: ["CTD (Seabird SBE41CP)", "Aanderaa Oxygen Optode", "pH Durafet"],
    mixedLayerDepth: 42,
    thermoclineDepth: 125,
    trajectory: [
      { lat: 14.80, lng: 70.90, cycle: 95, date: "1 month ago" },
      { lat: 14.95, lng: 71.20, cycle: 96, date: "20 days ago" },
      { lat: 15.12, lng: 71.55, cycle: 97, date: "10 days ago" },
      { lat: 15.2993, lng: 71.8542, cycle: 98, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 29.1, salinity: 36.6, oxygen: 198, density: 23.4 },
      { depth: 10, temp: 29.0, salinity: 36.6, oxygen: 196, density: 23.4 },
      { depth: 25, temp: 28.7, salinity: 36.5, oxygen: 190, density: 23.6 },
      { depth: 50, temp: 27.2, salinity: 36.2, oxygen: 160, density: 24.1 },
      { depth: 75, temp: 24.1, salinity: 35.8, oxygen: 110, density: 25.1 },
      { depth: 100, temp: 20.5, salinity: 35.5, oxygen: 60, density: 25.9 },
      { depth: 150, temp: 17.1, salinity: 35.3, oxygen: 22, density: 26.4 }, // Oxygen minimum zone
      { depth: 200, temp: 14.8, salinity: 35.2, oxygen: 14, density: 26.7 },
      { depth: 300, temp: 12.3, salinity: 35.1, oxygen: 18, density: 27.0 },
      { depth: 500, temp: 9.8, salinity: 35.0, oxygen: 28, density: 27.3 },
      { depth: 750, temp: 7.6, salinity: 34.9, oxygen: 48, density: 27.5 },
      { depth: 1000, temp: 6.0, salinity: 34.8, oxygen: 78, density: 27.6 },
      { depth: 1500, temp: 4.0, salinity: 34.7, oxygen: 112, density: 27.7 },
      { depth: 2000, temp: 2.9, salinity: 34.7, oxygen: 138, density: 27.8 }
    ]
  },
  {
    id: "ARGO-IN-2903550",
    wmoNumber: "2903550",
    name: "Equatorial-Deep-Argo-02",
    institution: "INCOIS / JAMSTEC",
    region: "Equatorial Indian Ocean",
    regionCategory: "equatorial_indian_ocean",
    lat: 1.4502,
    lng: 85.1204,
    status: "Profiling",
    cycleNumber: 64,
    lastTransmission: "4 hours ago",
    timestamp: "2026-09-02T02:15:00Z",
    surfaceTemp: 29.8, // Warm pool
    deepTemp: 1.8,
    surfaceSalinity: 34.4,
    deepSalinity: 34.7,
    surfacePressure: 6.0,
    maxDepth: 4000, // Deep Argo float
    batteryPercent: 79,
    transmissionType: "Iridium SBD",
    sensors: ["Deep CTD (SBE61)", "Turbulence Microstructure", "BGC Sensor Suite"],
    mixedLayerDepth: 55,
    thermoclineDepth: 140,
    trajectory: [
      { lat: 0.85, lng: 83.90, cycle: 61, date: "1 month ago" },
      { lat: 1.05, lng: 84.30, cycle: 62, date: "20 days ago" },
      { lat: 1.25, lng: 84.70, cycle: 63, date: "10 days ago" },
      { lat: 1.4502, lng: 85.1204, cycle: 64, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 29.8, salinity: 34.4, oxygen: 202, density: 22.0 },
      { depth: 10, temp: 29.7, salinity: 34.4, oxygen: 200, density: 22.1 },
      { depth: 50, temp: 29.2, salinity: 34.5, oxygen: 195, density: 22.4 },
      { depth: 100, temp: 25.1, salinity: 34.9, oxygen: 160, density: 23.9 },
      { depth: 200, temp: 15.6, salinity: 35.1, oxygen: 85, density: 26.2 },
      { depth: 500, temp: 8.9, salinity: 35.0, oxygen: 65, density: 27.2 },
      { depth: 1000, temp: 5.2, salinity: 34.8, oxygen: 92, density: 27.6 },
      { depth: 2000, temp: 2.8, salinity: 34.7, oxygen: 150, density: 27.8 },
      { depth: 3000, temp: 2.1, salinity: 34.7, oxygen: 175, density: 27.9 },
      { depth: 4000, temp: 1.8, salinity: 34.7, oxygen: 185, density: 28.0 }
    ]
  },
  {
    id: "ARGO-IN-2902905",
    wmoNumber: "2902905",
    name: "INCOIS-Navis-019",
    institution: "INCOIS India",
    region: "Northern Bay of Bengal",
    regionCategory: "bay_of_bengal",
    lat: 18.7214,
    lng: 88.3491,
    status: "Surface Uplink",
    cycleNumber: 178,
    lastTransmission: "Just now",
    timestamp: "2026-09-02T06:20:00Z",
    surfaceTemp: 29.5,
    deepTemp: 3.4,
    surfaceSalinity: 31.4, // Extremely low surface salinity from Ganges-Brahmaputra plume
    deepSalinity: 34.9,
    surfacePressure: 4.1,
    maxDepth: 2000,
    batteryPercent: 81,
    transmissionType: "Iridium Router-Based",
    sensors: ["CTD (Seabird SBE41CP)", "Nitrate SUNA V2", "PAR Sensor"],
    mixedLayerDepth: 22, // Shallow barrier layer
    thermoclineDepth: 85,
    trajectory: [
      { lat: 17.90, lng: 87.80, cycle: 175, date: "1 month ago" },
      { lat: 18.20, lng: 88.00, cycle: 176, date: "20 days ago" },
      { lat: 18.45, lng: 88.20, cycle: 177, date: "10 days ago" },
      { lat: 18.7214, lng: 88.3491, cycle: 178, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 29.5, salinity: 31.4, oxygen: 215, density: 19.8 },
      { depth: 10, temp: 29.4, salinity: 31.8, oxygen: 212, density: 20.1 },
      { depth: 25, temp: 28.8, salinity: 33.2, oxygen: 195, density: 21.3 },
      { depth: 50, temp: 25.9, salinity: 34.4, oxygen: 155, density: 23.0 },
      { depth: 100, temp: 18.5, salinity: 34.9, oxygen: 80, density: 25.3 },
      { depth: 200, temp: 13.2, salinity: 35.0, oxygen: 35, density: 26.5 },
      { depth: 500, temp: 9.1, salinity: 34.9, oxygen: 40, density: 27.2 },
      { depth: 1000, temp: 5.6, salinity: 34.8, oxygen: 90, density: 27.6 },
      { depth: 2000, temp: 3.4, salinity: 34.8, oxygen: 140, density: 27.8 }
    ]
  },
  {
    id: "ARGO-IN-2903822",
    wmoNumber: "2903822",
    name: "South-Arabian-CTD-99",
    institution: "INCOIS / NOAA",
    region: "Southern Arabian Sea / Lakshadweep",
    regionCategory: "arabian_sea",
    lat: 9.8512,
    lng: 73.4021,
    status: "Active",
    cycleNumber: 112,
    lastTransmission: "35 mins ago",
    timestamp: "2026-09-02T05:32:00Z",
    surfaceTemp: 28.9,
    deepTemp: 3.0,
    surfaceSalinity: 35.8,
    deepSalinity: 34.8,
    surfacePressure: 5.0,
    maxDepth: 2000,
    batteryPercent: 95,
    transmissionType: "Iridium SBD",
    sensors: ["CTD (Seabird SBE41CP)", "Optode 4330"],
    mixedLayerDepth: 38,
    thermoclineDepth: 115,
    trajectory: [
      { lat: 9.20, lng: 72.80, cycle: 109, date: "1 month ago" },
      { lat: 9.45, lng: 73.05, cycle: 110, date: "20 days ago" },
      { lat: 9.68, lng: 73.25, cycle: 111, date: "10 days ago" },
      { lat: 9.8512, lng: 73.4021, cycle: 112, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 28.9, salinity: 35.8, oxygen: 205, density: 22.9 },
      { depth: 10, temp: 28.8, salinity: 35.8, oxygen: 204, density: 22.9 },
      { depth: 50, temp: 27.5, salinity: 35.9, oxygen: 175, density: 23.6 },
      { depth: 100, temp: 21.2, salinity: 35.4, oxygen: 90, density: 25.6 },
      { depth: 200, temp: 14.5, salinity: 35.1, oxygen: 30, density: 26.6 },
      { depth: 500, temp: 9.5, salinity: 35.0, oxygen: 36, density: 27.2 },
      { depth: 1000, temp: 5.9, salinity: 34.8, oxygen: 82, density: 27.6 },
      { depth: 2000, temp: 3.0, salinity: 34.8, oxygen: 142, density: 27.8 }
    ]
  },
  {
    id: "ARGO-IN-2904011",
    wmoNumber: "2904011",
    name: "Andaman-Basin-Float-14",
    institution: "INCOIS India",
    region: "Andaman Sea",
    regionCategory: "bay_of_bengal",
    lat: 11.6670,
    lng: 92.7359,
    status: "Active",
    cycleNumber: 53,
    lastTransmission: "2 hours ago",
    timestamp: "2026-09-02T04:10:00Z",
    surfaceTemp: 29.2,
    deepTemp: 4.8, // Andaman deep water is warmer due to shallow sills limiting Antarctic bottom water inflow
    surfaceSalinity: 32.8,
    deepSalinity: 34.7,
    surfacePressure: 4.9,
    maxDepth: 2000,
    batteryPercent: 86,
    transmissionType: "Iridium SBD",
    sensors: ["CTD (Seabird SBE41CP)", "Oxygen Optode", "Transmissometer"],
    mixedLayerDepth: 30,
    thermoclineDepth: 95,
    trajectory: [
      { lat: 11.20, lng: 92.20, cycle: 50, date: "1 month ago" },
      { lat: 11.35, lng: 92.40, cycle: 51, date: "20 days ago" },
      { lat: 11.50, lng: 92.60, cycle: 52, date: "10 days ago" },
      { lat: 11.6670, lng: 92.7359, cycle: 53, date: "Current" }
    ],
    profile: [
      { depth: 0, temp: 29.2, salinity: 32.8, oxygen: 210, density: 20.7 },
      { depth: 25, temp: 29.0, salinity: 33.1, oxygen: 205, density: 21.0 },
      { depth: 50, temp: 27.0, salinity: 34.2, oxygen: 165, density: 22.7 },
      { depth: 100, temp: 20.1, salinity: 34.8, oxygen: 85, density: 25.0 },
      { depth: 200, temp: 14.1, salinity: 34.9, oxygen: 45, density: 26.2 },
      { depth: 500, temp: 8.8, salinity: 34.8, oxygen: 50, density: 27.1 },
      { depth: 1000, temp: 6.2, salinity: 34.7, oxygen: 75, density: 27.5 },
      { depth: 2000, temp: 4.8, salinity: 34.7, oxygen: 110, density: 27.7 }
    ]
  }
];

export const RECENT_CONVERSATIONS = [
  {
    id: "conv-1",
    title: "Salinity near Chennai",
    preview: "Surface salinity measured at 33.1 PSU by ARGO-IN-2902741...",
    timestamp: "10m ago",
    category: "Salinity"
  },
  {
    id: "conv-2",
    title: "Indian Ocean temperature",
    preview: "Equatorial Warm Pool reaches 29.8°C with deep thermocline...",
    timestamp: "2h ago",
    category: "Temperature"
  },
  {
    id: "conv-3",
    title: "ARGO floats near Bay of Bengal",
    preview: "3 active floats detected within 250 nautical miles...",
    timestamp: "Yesterday",
    category: "Floats"
  },
  {
    id: "conv-4",
    title: "Ocean profile analysis",
    preview: "Comparative CTD vertical profile down to 2,000 meters depth...",
    timestamp: "3d ago",
    category: "Profiles"
  },
  {
    id: "conv-5",
    title: "Arabian Sea vs Bay of Bengal",
    preview: "Halocline contrast due to high evaporation vs river runoff...",
    timestamp: "5d ago",
    category: "Comparison"
  }
];

export const EXAMPLE_QUERIES = [
  {
    id: "q1",
    text: "What's the salinity near Chennai?",
    category: "Salinity & Coastal",
    badge: "Bay of Bengal"
  },
  {
    id: "q2",
    text: "Show temperature profiles in the Indian Ocean",
    category: "Thermal Structure",
    badge: "Deep CTD"
  },
  {
    id: "q3",
    text: "Where are the nearest ARGO floats?",
    category: "Real-time Telemetry",
    badge: "Live Fleet"
  },
  {
    id: "q4",
    text: "How has ocean temperature changed?",
    category: "Climate & Trends",
    badge: "Time-Series"
  },
  {
    id: "q5",
    text: "Compare Arabian Sea vs Bay of Bengal thermoclines",
    category: "Comparative Oceanography",
    badge: "Regional Analysis"
  }
];

/**
 * Intelligent mock response generator for demo questions
 */
export function generateMockAiResponse(queryText) {
  const q = queryText.toLowerCase();

  if (q.includes("chennai") || q.includes("salinity near chennai")) {
    const float = ARGO_FLOATS[0]; // ARGO-IN-2902741
    return {
      text: `### Oceanographic Salinity Analysis: Off Chennai (Bay of Bengal)
Based on real-time telemetry from **ARGO Float ${float.id}** (WMO: ${float.wmoNumber}) positioned at **13.0827° N, 80.2707° E**:

- **Surface Salinity**: **33.10 PSU** (Practical Salinity Units)
- **Mixed Layer Depth**: **35 meters**
- **Deep Ocean Salinity (2,000m)**: **34.80 PSU**

#### Key Scientific Findings:
1. **Freshwater Dilution Plume**: The surface salinity is markedly lower than open ocean averages (~35.0 PSU) due to seasonal monsoonal precipitation and significant freshwater influx from the Krishna-Godavari and Gangetic river basin discharge flowing southward along the East India Coastal Current (EICC).
2. **Sharp Halocline**: A steep salinity gradient is observed between **25m and 100m depth**, creating a strong density barrier layer that inhibits vertical mixing and retains heat in the upper oceanic layer.`,
      kpis: [
        { label: "Surface Salinity", value: "33.10 PSU", change: "-0.4 vs baseline", type: "salinity", icon: "Droplets" },
        { label: "Surface Temp", value: "28.4 °C", change: "+0.3 °C anomaly", type: "temp", icon: "Thermometer" },
        { label: "Mixed Layer Depth", value: "35 m", change: "Stable", type: "depth", icon: "Layers" },
        { label: "Reporting Float", value: float.id, change: "Cycle #142", type: "float", icon: "Activity" }
      ],
      relevantFloatId: float.id,
      floats: [float],
      chartData: float.profile,
      chartType: "salinity",
      mapFocus: { lat: float.lat, lng: float.lng, zoom: 7 },
      followUps: [
        "How does Chennai salinity compare to the Arabian Sea?",
        "Show the full temperature-depth profile for this float",
        "Inspect the 10-day drift trajectory of ARGO-IN-2902741"
      ]
    };
  }

  if (q.includes("temperature profile") || q.includes("indian ocean") || q.includes("thermal")) {
    const float = ARGO_FLOATS[2]; // Equatorial Indian Ocean
    return {
      text: `### Vertical Thermal Structure: Equatorial Indian Ocean
Telemetry from **ARGO Float ${float.id}** (WMO: ${float.wmoNumber}) reveals the vertical thermal stratification in the equatorial warm pool:

- **Sea Surface Temperature (SST)**: **29.80 °C** (Super-heated equatorial surface layer)
- **Thermocline Zone**: **75m to 300m**, where temperature precipitously drops from **28.2°C to 11.7°C** (ΔT ≈ 16.5°C).
- **Deep Abyss (2,000m - 4,000m)**: Cools steadily to **1.80 °C** as it interfaces with Antarctic Bottom Water (AABW) penetration.

#### Oceanographic Significance:
The Equatorial Indian Ocean displays a deep mixed layer depth of **55 meters** sustained by strong equatorial trade winds and eastward Wyrtki jets during inter-monsoon transitions.`,
      kpis: [
        { label: "Surface SST", value: "29.80 °C", change: "Warm Pool Peak", type: "temp", icon: "Thermometer" },
        { label: "Thermocline Core", value: "140 m", change: "Gradient: -0.12°C/m", type: "depth", icon: "Layers" },
        { label: "Abyssal Temp (4km)", value: "1.80 °C", change: "Deep Argo", type: "temp", icon: "Gauge" },
        { label: "Active Floats in Region", value: "14 Floats", change: "100% telemetry", type: "float", icon: "Activity" }
      ],
      relevantFloatId: float.id,
      floats: ARGO_FLOATS,
      chartData: float.profile,
      chartType: "temperature",
      mapFocus: { lat: float.lat, lng: float.lng, zoom: 5 },
      followUps: [
        "What is the oxygen concentration in the sub-surface layer?",
        "Compare Bay of Bengal vs Arabian Sea vertical stratification",
        "View all active Deep ARGO floats in the Indian Ocean"
      ]
    };
  }

  if (q.includes("nearest") || q.includes("where are") || q.includes("floats")) {
    return {
      text: `### ARGO Fleet Distribution: Indian Ocean Sector
There are currently **6 ARGO floats** actively monitoring the northern and equatorial Indian Ocean basin in our active demo cluster (part of the global network of ~3,800 autonomous profiling floats).

- **Bay of Bengal**: 3 floats operational (\`ARGO-IN-2902741\`, \`ARGO-IN-2902905\`, \`ARGO-IN-2904011\`)
- **Arabian Sea**: 2 floats operational (\`ARGO-IN-2903118\`, \`ARGO-IN-2903822\`)
- **Equatorial Deep Sector**: 1 Deep-Argo unit (\`ARGO-IN-2903550\` diving to 4,000m)

All units are currently transmitting via **Iridium Satellite SBD** on standard 10-day profiling cycles.`,
      kpis: [
        { label: "Active Regional Floats", value: "6 Deployed", change: "3,842 Globally", type: "float", icon: "Activity" },
        { label: "Surface Uplink Floats", value: "1 Transmitting", change: "Real-time", type: "float", icon: "Zap" },
        { label: "Deep Profiling Floats", value: "1 at 4,000m", change: "Deep Argo", type: "depth", icon: "Layers" },
        { label: "Mean Fleet Battery", value: "87.3 %", change: "Nominal", type: "battery", icon: "Battery" }
      ],
      relevantFloatId: ARGO_FLOATS[0].id,
      floats: ARGO_FLOATS,
      chartData: ARGO_FLOATS[0].profile,
      chartType: "combined",
      mapFocus: { lat: 12.0, lng: 80.0, zoom: 5 },
      followUps: [
        "Show telemetry for float ARGO-IN-2902741",
        "What is the salinity near Chennai?",
        "Filter for Deep-Argo floats only"
      ]
    };
  }

  if (q.includes("arabian sea") || q.includes("compare") || q.includes("bay of bengal")) {
    const arabianFloat = ARGO_FLOATS[1];
    const bobFloat = ARGO_FLOATS[0];
    return {
      text: `### Regional Comparative Analysis: Arabian Sea vs. Bay of Bengal

The Arabian Sea and the Bay of Bengal exhibit radically distinct thermodynamic and hydrographic regimes despite occupying identical tropical latitude belts:

| Ocean Feature | Arabian Sea (Float ${arabianFloat.wmoNumber}) | Bay of Bengal (Float ${bobFloat.wmoNumber}) | Oceanographic Driver |
|---|---|---|---|
| **Surface Salinity** | **36.60 PSU** | **33.10 PSU** | High evaporation vs massive river runoff |
| **Surface Temp** | **29.10 °C** | **28.40 °C** | Strong solar insolation & coastal upwelling |
| **Mixed Layer Depth** | **42 m** | **35 m** | Heavy wind-driven stirring in Arabian Sea |
| **Oxygen Minimum Zone** | **Severe (14 µmol/kg at 200m)** | **Moderate (42 µmol/kg at 200m)** | High primary productivity & biological consumption |

#### Scientific Implication:
The high salinity water mass from the Arabian Sea sinks and spreads eastward as the **Arabian Sea High Salinity Water (ASHSW)**, undercutting the lighter, fresher Bay of Bengal surface water layer.`,
      kpis: [
        { label: "Arabian Salinity", value: "36.60 PSU", change: "+3.50 PSU vs BoB", type: "salinity", icon: "Droplets" },
        { label: "Bay of Bengal Salinity", value: "33.10 PSU", change: "Freshwater plume", type: "salinity", icon: "Droplets" },
        { label: "Arabian OMZ Core", value: "14 µmol/kg", change: "Suboxic zone", type: "temp", icon: "AlertTriangle" },
        { label: "Comparative Floats", value: "2 Profiling", change: "Synchronized", type: "float", icon: "Activity" }
      ],
      relevantFloatId: arabianFloat.id,
      floats: [arabianFloat, bobFloat],
      chartData: arabianFloat.profile,
      chartType: "combined",
      mapFocus: { lat: 14.0, lng: 76.0, zoom: 5 },
      followUps: [
        "Why is there an Oxygen Minimum Zone in the Arabian Sea?",
        "Show salinity profile down to 2,000m",
        "Inspect the Arabian Sea Provor float telemetry"
      ]
    };
  }

  // Default fallback realistic response
  const defaultFloat = ARGO_FLOATS[0];
  return {
    text: `### Ocean Intelligence Synthesis for: "${queryText}"
Analyzing autonomous ARGO CTD telemetry and hydrographic datasets across the Indian Ocean basin:

- **Regional Thermal State**: Surface temperatures average **28.8°C**, transitioning into a pronounced thermocline between **40m and 180m**.
- **Halocline Structure**: Salinity profiles show marked geographical contrast ranging from **31.4 PSU** in the northern Bay of Bengal river plume to **36.6 PSU** in the high-evaporation Arabian Sea.
- **Sub-surface Circulation**: Autonomous drift at the 1,000m parking depth indicates steady cyclonic and anti-cyclonic eddy recirculation.

You can inspect individual ARGO float CTD casts, observe vertical depth curves, or click any float marker on the map for complete physical metadata.`,
    kpis: [
      { label: "Mean SST", value: "28.8 °C", change: "Basin average", type: "temp", icon: "Thermometer" },
      { label: "Mean Salinity", value: "34.6 PSU", change: "Stratified", type: "salinity", icon: "Droplets" },
      { label: "Active Floats", value: "6 Floats", change: "Online", type: "float", icon: "Activity" },
      { label: "Profile Depth", value: "0 - 2,000 m", change: "High Resolution", type: "depth", icon: "Layers" }
    ],
    relevantFloatId: defaultFloat.id,
    floats: ARGO_FLOATS,
    chartData: defaultFloat.profile,
    chartType: "temperature",
    mapFocus: { lat: 13.0, lng: 80.0, zoom: 6 },
    followUps: [
      "What's the salinity near Chennai?",
      "Show temperature profiles in the Indian Ocean",
      "Where are the nearest ARGO floats?"
    ]
  };
}
