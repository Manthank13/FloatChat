/**
 * FloatChat Climate & Disaster Intelligence Mock Data Service (src/services/mockData.js)
 * Implements the adaptive response-driven schema for climate-risk investigations.
 */

import { ARGO_FLOATS, generateMockAiResponse } from '../data/mockData';

export { ARGO_FLOATS };

/**
 * Adaptive Climate Risk & Environmental Response Generator
 * @param {string} query
 * @returns {Object} Structured response model
 */
export function mockSubmitQuery(query) {
  const q = (query || "").toLowerCase();

  // 1. COMPARISON INTENT (e.g. "Compare cyclone risk between Chennai and Mumbai" or "Compare Arabian Sea and Bay of Bengal")
  if (q.includes("compare") || (q.includes("chennai") && q.includes("mumbai")) || (q.includes("arabian") && q.includes("bengal"))) {
    const floatChennai = ARGO_FLOATS[0];
    const floatMumbai = ARGO_FLOATS[1];

    const comparisonData = {
      title: "Regional Climate Risk & Cyclone Potential Contrast: Chennai vs Mumbai",
      locationA: {
        name: "Chennai (South Bay of Bengal)",
        riskLevel: "elevated",
        sst: "28.4 °C",
        sstAnomaly: "+0.8°C Anomaly",
        salinity: "33.1 PSU (Low / Diluted)",
        barrierLayer: "28m Freshwater Cap",
        mld: "35m",
        cyclonePotential: "Elevated (>85 kJ/cm²)",
        floatId: floatChennai.id
      },
      locationB: {
        name: "Mumbai (Central Arabian Sea)",
        riskLevel: "moderate",
        sst: "29.1 °C",
        sstAnomaly: "+0.3°C Anomaly",
        salinity: "36.6 PSU (High Salinity)",
        barrierLayer: "None (Deep Convective Mixing)",
        mld: "65m",
        cyclonePotential: "Moderate (~55 kJ/cm²)",
        floatId: floatMumbai.id
      },
      keyDifferences: [
        {
          metric: "Halocline Barrier Layer & Heat Trapping",
          diff: "Bay of Bengal has low surface salinity (33.1 PSU) creating a 28m buoyant freshwater barrier layer. Arabian Sea has high salinity (36.6 PSU) with strong vertical mixing.",
          significance: "Freshwater capping prevents heat dissipation in the Bay of Bengal, preserving high Upper Ocean Heat Content."
        },
        {
          metric: "Mixed Layer Depth (MLD)",
          diff: "Chennai sector has a shallow MLD of 35m; Mumbai sector has a deep MLD of 65m.",
          significance: "A shallower warm layer concentrates solar thermodynamic energy near the surface rather than diluting it into deep abyssal water."
        },
        {
          metric: "Tropical Cyclone Heat Potential (TCHP)",
          diff: "Bay of Bengal TCHP >85 kJ/cm² vs Arabian Sea TCHP ~55 kJ/cm².",
          significance: "Significantly higher thermodynamic fuel available for cyclogenesis and rapid intensification along the southeastern seaboard."
        }
      ]
    };

    const prose = `### Dual-Basin Climate Risk Contrast: Chennai vs Mumbai

A comparative analysis of in-situ telemetry from **Float ${floatChennai.id}** (Bay of Bengal) and **Float ${floatMumbai.id}** (Arabian Sea) reveals significant hydrographic contrasts influencing regional disaster vulnerability.

#### 1. Observation
- **Chennai Sector (Bay of Bengal)**: Sea Surface Temperature (SST) at **28.40 °C** with surface salinity diluted to **33.10 PSU** by river runoff.
- **Mumbai Sector (Arabian Sea)**: SST at **29.10 °C** with high surface salinity at **36.60 PSU** driven by strong atmospheric evaporation.

#### 2. Scientific Insight
- Low-salinity freshwater plumes off Chennai form a stable **28m halocline barrier layer**, inhibiting vertical turbulent mixing and trapping heat.
- Conversely, dense saline water in the Arabian Sea promotes vertical convection down to 65m, dispersing thermal energy across a deeper layer.

#### 3. Climate Risk & Disaster Relevance
- **Chennai**: **Elevated Risk Signal** — High Tropical Cyclone Heat Potential (>85 kJ/cm²) coupled with barrier layers provides favorable thermodynamic conditions for cyclone intensification.
- **Mumbai**: **Moderate Risk Signal** — Deep mixing mitigates rapid thermal concentration, though seasonal pre-monsoon warming requires ongoing observation.

#### 4. Observational Evidence
- Calibrated CTD sensors on ARGO Floats **${floatChennai.id}** and **${floatMumbai.id}** (RTQC Calibrated).`;

    return {
      query,
      queryIntent: "comparison",
      location: {
        name: "Chennai vs Mumbai Coastal Basins",
        latitude: 14.5,
        longitude: 76.0,
        regionCategory: "comparative"
      },
      float: floatChennai,
      floats: [floatChennai, floatMumbai],
      summary: {
        surface_temperature: 28.4,
        surface_salinity: 33.1,
        mixed_layer_depth: 35,
        thermocline_depth: 110,
        max_depth: 2000
      },
      riskLevel: "elevated",
      riskTitle: "Differential Regional Cyclone & Stratification Risk",
      riskSummary: "Bay of Bengal exhibits elevated cyclone heat potential (>85 kJ/cm²) due to barrier layer heat trapping, whereas the Arabian Sea maintains moderate risk due to deeper vertical mixing.",
      comparison: comparisonData,
      kpis: [
        { label: "CHENNAI SST", value: "28.4 °C", anomaly: "+0.8°C Anomaly", riskRelevance: "Elevated Heat Fuel", riskLevel: "elevated", type: "temp", icon: "Thermometer" },
        { label: "MUMBAI SST", value: "29.1 °C", anomaly: "+0.3°C Anomaly", riskRelevance: "Moderate Baseline", riskLevel: "moderate", type: "temp", icon: "Thermometer" },
        { label: "SALINITY CONTRAST", value: "ΔS = 3.5 PSU", anomaly: "Freshwater Capping", riskRelevance: "Heat Trapping in East", riskLevel: "elevated", type: "salinity", icon: "Droplets" },
        { label: "EVIDENCE QUALITY", value: "RTQC PASS", anomaly: "Dual Sensor Sync", riskRelevance: "Float #2902741 / #2903118", riskLevel: "nominal", type: "float", icon: "Activity" }
      ],
      hazards: [
        { category: "Cyclonic Intensification", title: "Asymmetric Storm Energy", detail: "Bay of Bengal upper ocean heat content is significantly higher than the Arabian Sea, creating asymmetric coastal vulnerability.", severity: "Elevated Relevance", color: "var(--red-critical)" },
        { category: "Coastal Rainfall Coupling", title: "Freshwater Plume Interaction", detail: "Low-salinity estuarine layers near Chennai reduce tidal flushing during extreme precipitation events.", severity: "Moderate Relevance", color: "var(--amber-warning)" }
      ],
      actions: [
        "Prioritize cyclone early warning readiness along the Tamil Nadu and Andhra Pradesh coastal rim.",
        "Maintain dual-basin profiling float monitoring to detect seasonal thermocline shoaling."
      ],
      profile: floatChennai.profile.map(p => ({
        depth: p.depth,
        temperature: p.temp,
        salinity: p.salinity,
        pressure: p.depth,
        density: p.density,
        oxygen: p.oxygen
      })),
      text: prose,
      source: {
        dataset: "ARGO GDAC / INCOIS",
        quality: "RTQC PASS",
        cycle: floatChennai.cycleNumber
      },
      followUps: [
        "Explain the environmental factors relevant to cyclone risk in this region",
        "Show temperature and salinity changes near Chennai",
        "What are the major climate risks in the Bay of Bengal?"
      ]
    };
  }

  // 2. TEMPERATURE & SALINITY PROFILE INTENT (e.g. "Show temperature and salinity changes near Chennai")
  if (q.includes("temperature and salinity") || q.includes("profile") || q.includes("depth") || q.includes("water column")) {
    const matchedFloat = ARGO_FLOATS[0];
    const prose = `### In-Situ Thermohaline & Water Column Profile: Bay of Bengal (Off Chennai)

High-resolution CTD profiling from **ARGO Float ${matchedFloat.id}** (WMO: ${matchedFloat.wmoNumber}) provides a detailed cross-section of temperature and salinity stratification from surface to 2,000m.

#### 1. Observation
- **Surface Layer (0–35m)**: Temperature is **${matchedFloat.surfaceTemp} °C** (+0.8°C above climatology) and salinity is **${matchedFloat.surfaceSalinity} PSU**.
- **Thermocline Zone (50–180m)**: Steep thermal gradient with temperature decreasing from 26.8°C to 14.2°C (ΔT = -0.12 °C/m).
- **Abyssal Base (1,000–2,000m)**: Cold, uniform intermediate water mass at **3.10 °C** and **34.80 PSU**.

#### 2. Scientific Insight
- A strong halocline separates the freshwater river-diluted surface cap from the saline core below 50m.
- This density stratification forms a **barrier layer** that inhibits vertical convective overturning.

#### 3. Climate Risk & Disaster Relevance
- **Thermal Heat Storage**: Trapped heat in the 35–80m layer preserves energy that can fuel tropical convective storms when atmospheric conditions align.
- **Marine Ecology**: Surface stratification limits vertical nutrient flux from deep waters.

#### 4. Observational Evidence
- 142 continuous CTD profiles recorded by Seabird SBE41CP sensor aboard Float **${matchedFloat.id}**.`;

    return {
      query,
      queryIntent: "profile",
      location: {
        name: "Bay of Bengal (Off Chennai)",
        latitude: matchedFloat.lat,
        longitude: matchedFloat.lng,
        regionCategory: matchedFloat.regionCategory
      },
      float: matchedFloat,
      floats: [matchedFloat],
      summary: {
        surface_temperature: matchedFloat.surfaceTemp,
        surface_salinity: matchedFloat.surfaceSalinity,
        mixed_layer_depth: matchedFloat.mixedLayerDepth,
        thermocline_depth: matchedFloat.thermoclineDepth,
        max_depth: matchedFloat.maxDepth
      },
      riskLevel: "moderate",
      riskTitle: "Thermohaline Stratification & Heat Storage Profile",
      riskSummary: "In-situ CTD vertical profiling indicates a well-developed halocline barrier layer with heat accumulation in the upper 80 meters.",
      kpis: [
        { label: "SEA SURFACE TEMP", value: `${matchedFloat.surfaceTemp} °C`, anomaly: "+0.8°C Anomaly", riskRelevance: "Trapped Upper Layer", riskLevel: "moderate", type: "temp", icon: "Thermometer" },
        { label: "SURFACE SALINITY", value: `${matchedFloat.surfaceSalinity} PSU`, anomaly: "-0.4 PSU (Plume)", riskRelevance: "Halocline Barrier Formed", riskLevel: "moderate", type: "salinity", icon: "Droplets" },
        { label: "THERMOCLINE DEPTH", value: `${matchedFloat.thermoclineDepth} m`, anomaly: "Steep Gradient", riskRelevance: "Sharp Density Boundary", riskLevel: "nominal", type: "depth", icon: "Layers" },
        { label: "DATA QUALITY", value: "RTQC PASS", anomaly: "Seabird CTD", riskRelevance: `Float #${matchedFloat.id}`, riskLevel: "nominal", type: "float", icon: "Activity" }
      ],
      profile: matchedFloat.profile.map(p => ({
        depth: p.depth,
        temperature: p.temp,
        salinity: p.salinity,
        pressure: p.depth,
        density: p.density,
        oxygen: p.oxygen
      })),
      hazards: [
        { category: "Thermal Stratification", title: "Subsurface Heat Retention", detail: "The transparent freshwater barrier prevents evaporative cooling of the underlying warm pool.", severity: "Moderate Relevance", color: "var(--amber-warning)" }
      ],
      actions: [
        "Monitor temporal evolution of the halocline layer across subsequent 10-day float cycles."
      ],
      text: prose,
      source: {
        dataset: "ARGO GDAC / INCOIS",
        quality: "RTQC PASS",
        cycle: matchedFloat.cycleNumber
      },
      followUps: [
        "Is Chennai at increased cyclone risk?",
        "Compare cyclone risk between Chennai and Mumbai",
        "What are the major climate risks in the Bay of Bengal?"
      ]
    };
  }

  // 3. CYCLONE RISK / EXTREME WEATHER INTENT (e.g. "Is Chennai at increased cyclone risk?")
  let matchedFloat = ARGO_FLOATS[0];
  let locationName = "Bay of Bengal (Off Chennai)";
  let riskLevel = "elevated";

  if (q.includes("arabian") || q.includes("mumbai") || q.includes("goa")) {
    matchedFloat = ARGO_FLOATS[1];
    locationName = "Arabian Sea (Off Goa / Mumbai)";
    riskLevel = "moderate";
  } else if (q.includes("equator") || q.includes("warm pool")) {
    matchedFloat = ARGO_FLOATS[2];
    locationName = "Equatorial Indian Ocean Warm Pool";
    riskLevel = "moderate";
  }

  const legacyResponse = generateMockAiResponse(query);

  const formattedProse = `### Climate Risk & Environmental Assessment: ${locationName}

In-situ observation from **ARGO Float ${matchedFloat.id}** (WMO: ${matchedFloat.wmoNumber}) indicates **Sea Surface Temperature (SST) at ${matchedFloat.surfaceTemp} °C** (+0.8°C above 30-year climatology) and **surface salinity at ${matchedFloat.surfaceSalinity} PSU**.

#### 1. Observation
- **Surface Thermal State**: SST measured at **${matchedFloat.surfaceTemp} °C**, crossing the 28.0 °C threshold required for deep atmospheric convection.
- **Salinity Dilution**: Surface salinity dropped to **${matchedFloat.surfaceSalinity} PSU** from Ganga-Godavari precipitation and river discharge.
- **Mixed Layer Depth (MLD)**: Established at a shallow **${matchedFloat.mixedLayerDepth} meters**.

#### 2. Scientific Insight
- **Halocline Barrier Layer**: A 28m low-salinity surface layer caps the water column, preventing deep wind-driven mixing.
- **Ocean Heat Retention**: Solar radiation penetrates the surface cap, storing high Tropical Cyclone Heat Potential (TCHP > 85 kJ/cm²) in the upper ocean.

#### 3. Climate Risk & Disaster Relevance
- **Risk-Relevant Signal**: **ELEVATED HAZARD SIGNAL** — High TCHP and barrier layers represent verified physical indicators that increase the likelihood of rapid cyclone intensification over the Bay of Bengal.
- **Coastal Exposure**: Low-lying deltaic and urban drainage systems along the Chennai coast face compounded vulnerability if cyclonic surges coincide with localized heavy precipitation.

#### 4. Observational Evidence
- Real-time telemetry confirmed by Seabird CTD sensors on Float **${matchedFloat.id}** (Cycle #${matchedFloat.cycleNumber}, RTQC Calibrated).`;

  return {
    query,
    queryIntent: "risk_assessment",
    location: {
      name: locationName,
      latitude: matchedFloat.lat,
      longitude: matchedFloat.lng,
      regionCategory: matchedFloat.regionCategory
    },
    float: matchedFloat,
    floats: legacyResponse.floats || ARGO_FLOATS,
    summary: {
      surface_temperature: matchedFloat.surfaceTemp,
      surface_salinity: matchedFloat.surfaceSalinity,
      deep_temperature: matchedFloat.deepTemp,
      mixed_layer_depth: matchedFloat.mixedLayerDepth,
      thermocline_depth: matchedFloat.thermoclineDepth,
      max_depth: matchedFloat.maxDepth
    },
    riskLevel: riskLevel,
    riskTitle: "Elevated Upper-Ocean Heat Content & Cyclone Potential",
    riskSummary: "Observed ocean temperatures (+0.8°C anomaly) and freshwater barrier layer create favorable thermodynamic conditions for rapid storm intensification in the South Bay of Bengal.",
    confidence: "94% (High In-situ Sensor Confidence)",
    kpis: [
      {
        label: "SEA SURFACE TEMPERATURE",
        value: `${matchedFloat.surfaceTemp} °C`,
        anomaly: matchedFloat.surfaceTemp > 28 ? "+0.8°C Anomaly" : "Nominal",
        riskRelevance: "Elevated Storm Thermal Fuel",
        riskLevel: matchedFloat.surfaceTemp > 28 ? "elevated" : "nominal",
        type: "temp",
        icon: "Thermometer"
      },
      {
        label: "SURFACE SALINITY",
        value: `${matchedFloat.surfaceSalinity} PSU`,
        anomaly: "-0.4 PSU vs Baseline",
        riskRelevance: "Barrier Layer Formed",
        riskLevel: "moderate",
        type: "salinity",
        icon: "Droplets"
      },
      {
        label: "MIXED LAYER DEPTH (MLD)",
        value: `${matchedFloat.mixedLayerDepth} m`,
        anomaly: "Current Status: Stratified",
        riskRelevance: "Shallow Heat Cap",
        riskLevel: "moderate",
        type: "depth",
        icon: "Layers"
      },
      {
        label: "EVIDENCE QUALITY",
        value: "RTQC PASS",
        anomaly: "WMO / INCOIS Calibrated",
        riskRelevance: `Float #${matchedFloat.id}`,
        riskLevel: "nominal",
        type: "float",
        icon: "Activity"
      }
    ],
    hazards: [
      {
        category: "Cyclone Heat Potential",
        title: "Elevated Thermodynamic Fuel (>85 kJ/cm²)",
        detail: "Warm water extends below the mixed layer, supplying continuous sensible heat to convective disturbances.",
        severity: "Elevated Relevance",
        color: "var(--red-critical)"
      },
      {
        category: "Coastal Surge Coupling",
        title: "Estuarine Inundation Vulnerability",
        detail: "Freshwater river discharge already saturates coastal waterways, amplifying storm surge impact along the Chennai-Ennore coast.",
        severity: "Moderate Relevance",
        color: "var(--amber-warning)"
      }
    ],
    actions: [
      "Alert coastal disaster management authorities to track rapid intensification indicators in the South Bay of Bengal.",
      "Verify urban stormwater discharge readiness in low-lying coastal zones.",
      "Maintain active 10-day profiling cadence on regional ARGO floats to detect subsurface cooling or deepening."
    ],
    profile: matchedFloat.profile.map(p => ({
      depth: p.depth,
      temperature: p.temp,
      salinity: p.salinity,
      pressure: p.depth,
      density: p.density,
      oxygen: p.oxygen
    })),
    text: formattedProse,
    source: {
      dataset: "ARGO GDAC / INCOIS",
      quality: "RTQC PASS",
      cycle: matchedFloat.cycleNumber
    },
    followUps: [
      "Show temperature and salinity changes near Chennai",
      "Compare cyclone risk between Chennai and Mumbai",
      "What are the major climate risks in the Bay of Bengal?"
    ],
    mapFocus: legacyResponse.mapFocus
  };
}

export function mockGetFloatDetails(floatId) {
  const found = ARGO_FLOATS.find((f) => f.id === floatId || f.wmoNumber === floatId) || ARGO_FLOATS[0];
  return {
    id: found.id,
    wmoNumber: found.wmoNumber,
    name: found.name,
    institution: found.institution,
    latitude: found.lat,
    longitude: found.lng,
    region: found.region,
    regionCategory: found.regionCategory,
    status: found.status,
    cycle: found.cycleNumber,
    cycleNumber: found.cycleNumber,
    lastTransmission: found.lastTransmission,
    timestamp: found.timestamp,
    surfaceTemp: found.surfaceTemp,
    deepTemp: found.deepTemp,
    surfaceSalinity: found.surfaceSalinity,
    deepSalinity: found.deepSalinity,
    maxDepth: found.maxDepth,
    batteryPercent: found.batteryPercent,
    transmissionType: found.transmissionType,
    sensors: found.sensors,
    profile: found.profile,
    trajectory: found.trajectory,
    mixedLayerDepth: found.mixedLayerDepth,
    thermoclineDepth: found.thermoclineDepth
  };
}

export function mockGetNearbyFloats(latitude, longitude, radiusKm = 500) {
  return ARGO_FLOATS.map((f) => {
    const dLat = (f.lat - latitude) * 111;
    const dLng = (f.lng - longitude) * 111 * Math.cos((latitude * Math.PI) / 180);
    const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);

    return {
      ...f,
      distanceKm: Math.round(distanceKm)
    };
  }).filter((f) => f.distanceKm <= radiusKm);
}

export function mockGetOceanProfile(floatId, variable = "temperature") {
  const float = ARGO_FLOATS.find((f) => f.id === floatId) || ARGO_FLOATS[0];
  return {
    floatId: float.id,
    wmoNumber: float.wmoNumber,
    variable,
    points: float.profile.map((p) => ({
      depth: p.depth,
      value: variable === "salinity" ? p.salinity : variable === "density" ? p.density : p.temp,
      unit: variable === "salinity" ? "PSU" : variable === "density" ? "kg/m³" : "°C"
    }))
  };
}

export function mockGetFleetStatus() {
  return {
    totalActiveGlobal: 3842,
    regionalIndianOceanCount: ARGO_FLOATS.length,
    nominalCadenceDays: 10,
    rtqcStatus: "NOMINAL",
    lastSynced: new Date().toISOString(),
    metrics: [
      { id: "sst", label: "SEA SURFACE TEMPERATURE", value: "28.4 °C", trend: "+0.8°C Anomaly (Elevated)", trendType: "up", riskRelevance: "Elevated thermal fuel for storms", note: "Tropical Warm Pool Sector" },
      { id: "salinity", label: "SURFACE SALINITY", value: "33.1 PSU", trend: "-0.4 PSU vs Baseline", trendType: "neutral", riskRelevance: "Barrier layer inhibiting mixing", note: "River Discharge Plume" },
      { id: "depth", label: "MIXED LAYER DEPTH", value: "35 meters", trend: "Status: Stratified", trendType: "neutral", riskRelevance: "Shallow thermocline cap", note: "In-situ CTD Layering" },
      { id: "floats", label: "CLIMATE OBSERVING FLEET", value: "3,842 Floats", trend: "Global Array Online", trendType: "up", riskRelevance: "100% telemetry downlink", note: "Autonomous Profiling Units" },
      { id: "quality", label: "CALIBRATION QUALITY", value: "98.4%", trend: "RTQC / DMQC Pass", trendType: "up", riskRelevance: "WMO Standard Ground Truth", note: "Verified Scientific Baseline" }
    ],
    sectors: [
      { name: "Bay of Bengal", active: 3, meanSST: 28.4, meanSalinity: 33.1 },
      { name: "Arabian Sea", active: 2, meanSST: 29.1, meanSalinity: 36.6 },
      { name: "Equatorial Deep", active: 1, meanSST: 29.8, meanSalinity: 35.1 }
    ]
  };
}

export function mockGetRegionalComparison(floatAId = "ARGO-IN-2902741", floatBId = "ARGO-IN-2903118") {
  const floatA = ARGO_FLOATS.find((f) => f.id === floatAId) || ARGO_FLOATS[0];
  const floatB = ARGO_FLOATS.find((f) => f.id === floatBId) || ARGO_FLOATS[1];

  return {
    floatA,
    floatB,
    metrics: [
      { label: "Sea Surface Temp (SST)", valA: `${floatA.surfaceTemp} °C`, valB: `${floatB.surfaceTemp} °C`, variance: `${Math.abs(floatA.surfaceTemp - floatB.surfaceTemp).toFixed(2)} °C ΔT (Thermal Contrast)` },
      { label: "Surface Salinity (Barrier Layer)", valA: `${floatA.surfaceSalinity} PSU`, valB: `${floatB.surfaceSalinity} PSU`, variance: `${Math.abs(floatA.surfaceSalinity - floatB.surfaceSalinity).toFixed(2)} PSU ΔS (Freshwater Plume)` },
      { label: "Mixed Layer Depth (MLD)", valA: `${floatA.mixedLayerDepth} meters`, valB: `${floatB.mixedLayerDepth} meters`, variance: `${Math.abs(floatA.mixedLayerDepth - floatB.mixedLayerDepth)} m difference in Heat Cap` },
      { label: "Thermocline Core Depth", valA: `${floatA.thermoclineDepth} meters`, valB: `${floatB.thermoclineDepth} meters`, variance: `${Math.abs(floatA.thermoclineDepth - floatB.thermoclineDepth)} m difference (Convective Fuel)` },
      { label: "Abyssal Deep Water (2000m)", valA: `${floatA.deepTemp} °C`, valB: `${floatB.deepTemp} °C`, variance: "Deep Antarctic Bottom Water (AABW) baseline" },
      { label: "Maximum Profiling Depth", valA: `${floatA.maxDepth} meters`, valB: `${floatB.maxDepth} meters`, variance: "Nominal 2,000 dbar CTD cast limit" }
    ]
  };
}

export function mockGetMissionLogs() {
  return [
    { id: 'c1', title: 'Cyclone risk assessment for Chennai', time: '10 min ago', basin: 'Bay of Bengal' },
    { id: 'c2', title: 'Compare cyclone risk: Chennai vs Mumbai', time: '1 hr ago', basin: 'Comparative' },
    { id: 'c3', title: 'Temperature & Salinity changes near Chennai', time: '3 hrs ago', basin: 'Bay of Bengal' },
    { id: 'c4', title: 'Major climate risks in Bay of Bengal', time: 'Yesterday', basin: 'Bay of Bengal' },
    { id: 'c5', title: 'Equatorial Warm Pool heat content', time: '2 days ago', basin: 'Equatorial' }
  ];
}
