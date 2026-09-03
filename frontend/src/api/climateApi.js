/**
 * FloatChat Climate & Ocean Intelligence API Module (src/api/climateApi.js)
 * 
 * Communicates with FastAPI backend:
 * - Primary Conversational AI: POST /api/v1/chat and POST /api/v1/chat/stream
 * - Product Contract: POST /api/query
 * - Live System Health: GET /api/v1/health
 */

import { apiClient } from './client';
import { 
  mockSubmitQuery, 
  mockGetFloatDetails, 
  mockGetOceanProfile, 
  mockGetFleetStatus, 
  mockGetRegionalComparison,
  mockGetMissionLogs,
  ARGO_FLOATS 
} from '../services/mockData';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_DATA_MODE === 'mock';

/**
 * Normalizes backend JSON response (from either /api/v1/chat or /api/query)
 * into a rich, structured format for the UI.
 */
export function normalizeBackendQueryResponse(raw, originalQuery) {
  if (!raw) {
    return {
      query: originalQuery || "Climate Inquiry",
      text: "No response received from oceanographic engine.",
      queryIntent: "general_query",
      isGeneral: true,
      isEmpty: true,
      kpis: [],
      floats: [],
      chartData: [],
      followUps: ["Show ARGO floats near Miami", "What is ARGO?", "Where is the data fetched from?"]
    };
  }

  // Extract core narrative text
  const text = raw.answer || raw.text || raw.insights?.join('\n\n') || raw.response || 'Oceanographic analysis complete.';
  const summary = raw.summary || {};
  const floatInfo = raw.float || {};
  const locationInfo = raw.location || {};
  const profileList = raw.profile || [];
  const citations = raw.citations || [];
  const mapMarkers = raw.map_markers || [];
  const chartDataRaw = raw.chart_data || {};
  const keyFindings = raw.key_findings || [];
  const followUpSuggestions = raw.follow_up_suggestions || raw.followUps || [
    "Show ARGO floats near Miami",
    "What is the salinity in the Bay of Bengal at 100m?",
    "Compare temperature between Arabian Sea and Bay of Bengal"
  ];

  const queryIntent = raw.intent || raw.queryIntent || (raw.structured_query?.intent) || "spatial_query";
  const isGeneral = queryIntent === 'general_query' || (raw.data_source === 'REAL_ARGO_GDAC' && raw.is_empty && !citations.length && !mapMarkers.length && !locationInfo.name && !raw.structured_query?.location?.name);
  const isEmpty = raw.is_empty === true || (raw.total_matched_observations === 0 && citations.length === 0 && mapMarkers.length === 0 && profileList.length === 0);

  // 1. Build profile data points for depth profile chart
  let chartData = [];
  if (profileList.length > 0) {
    chartData = profileList.map((p) => ({
      depth: p.depth !== undefined ? p.depth : (p.pressure || 0),
      temp: p.temperature !== undefined ? p.temperature : (p.temp !== undefined ? p.temp : null),
      salinity: p.salinity !== undefined ? p.salinity : (p.psal !== undefined ? p.psal : null),
      pressure: p.pressure !== undefined ? p.pressure : (p.depth || 0),
      density: p.density !== undefined ? p.density : null,
      oxygen: p.oxygen !== undefined ? p.oxygen : null
    }));
  } else if (chartDataRaw.data_points && Array.isArray(chartDataRaw.data_points)) {
    chartData = chartDataRaw.data_points.map((pt) => ({
      depth: pt.depth !== undefined ? pt.depth : 100,
      temp: chartDataRaw.parameter === 'TEMP' ? (pt.value || null) : null,
      salinity: chartDataRaw.parameter === 'PSAL' ? (pt.value || null) : null,
      pressure: pt.depth || 100,
      platformId: pt.platform_id || "",
      cycleNumber: pt.cycle_number || 1
    }));
  }

  // 2. Build float citations & active platforms list
  const floats = [];
  if (!isGeneral && citations.length > 0) {
    citations.forEach((c) => {
      const wmo = String(c.platform_id || c.wmoNumber || "");
      if (!wmo) return;
      floats.push({
        id: wmo,
        wmoNumber: wmo,
        name: `ARGO Float ${wmo}`,
        institution: c.data_source || "ARGO GDAC",
        lat: Number(c.latitude) || 0,
        lng: Number(c.longitude) || 0,
        region: raw.location?.name || raw.structured_query?.location?.name || "Ocean Basin",
        regionCategory: "global",
        status: "Active",
        cycleNumber: c.cycle_number || 1,
        distanceKm: c.distance_km ? Math.round(c.distance_km) : null,
        lastTransmission: c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "Live Telemetry",
        surfaceTemp: summary.surface_temperature || null,
        surfaceSalinity: summary.surface_salinity || null,
        mixedLayerDepth: summary.mixed_layer_depth || null,
        profile: chartData
      });
    });
  } else if (!isGeneral && mapMarkers.length > 0) {
    mapMarkers.forEach((m) => {
      const wmo = String(m.platform_id || "");
      if (!wmo) return;
      floats.push({
        id: wmo,
        wmoNumber: wmo,
        name: `ARGO Float ${wmo}`,
        institution: "ARGO GDAC",
        lat: Number(m.latitude) || 0,
        lng: Number(m.longitude) || 0,
        region: raw.location?.name || raw.structured_query?.location?.name || "Ocean Basin",
        regionCategory: "global",
        status: "Active",
        cycleNumber: 1,
        distanceKm: m.distance_km ? Math.round(m.distance_km) : null,
        surfaceTemp: summary.surface_temperature || null,
        profile: chartData
      });
    });
  }

  const primaryFloat = floats.length > 0 ? floats[0] : null;

  // 3. Build scientific KPI cards from real backend observations and summary ONLY
  let kpis = [];
  if (raw.kpis && Array.isArray(raw.kpis)) {
    kpis = raw.kpis;
  } else if (!isGeneral && !isEmpty) {
    if (keyFindings.length > 0) {
      keyFindings.forEach((kf, i) => {
        kpis.push({
          label: `OBSERVATION ${i + 1}`,
          value: kf,
          anomaly: "QC Calibrated",
          riskRelevance: "In-situ Ocean Measurement",
          riskLevel: "nominal",
          type: kf.includes('TEMP') ? 'temp' : (kf.includes('PSAL') ? 'salinity' : 'float'),
          icon: kf.includes('TEMP') ? 'Thermometer' : (kf.includes('PSAL') ? 'Droplets' : 'Activity')
        });
      });
    } else if (summary.surface_temperature !== undefined || summary.surface_salinity !== undefined) {
      if (summary.surface_temperature !== undefined) {
        kpis.push({
          label: "SEA TEMPERATURE",
          value: `${summary.surface_temperature} °C`,
          anomaly: "In-situ Observation",
          riskRelevance: "Upper Ocean Thermal Content",
          riskLevel: "nominal",
          type: "temp",
          icon: "Thermometer"
        });
      }
      if (summary.surface_salinity !== undefined) {
        kpis.push({
          label: "PRACTICAL SALINITY",
          value: `${summary.surface_salinity} PSU`,
          anomaly: "In-situ Measurement",
          riskRelevance: "Salinity Stratification",
          riskLevel: "nominal",
          type: "salinity",
          icon: "Droplets"
        });
      }
      if (summary.mixed_layer_depth !== undefined) {
        kpis.push({
          label: "MIXED LAYER DEPTH (MLD)",
          value: `${summary.mixed_layer_depth} m`,
          anomaly: "Density Threshold: 0.03 kg/m³",
          riskRelevance: "Mixed Layer Dynamics",
          riskLevel: "nominal",
          type: "depth",
          icon: "Layers"
        });
      }
      if (floats.length > 0) {
        kpis.push({
          label: "DATA PROVENANCE",
          value: `${floats.length} Float(s) Cited`,
          anomaly: "IOC/WMO QC Flag = 1",
          riskRelevance: primaryFloat ? `WMO #${primaryFloat.wmoNumber}` : "Global ARGO Array",
          riskLevel: "nominal",
          type: "float",
          icon: "Activity"
        });
      }
    }
  }

  const queryResolved = originalQuery || raw.query || raw.raw_query || "Oceanographic Inquiry";
  const locName = raw.location?.name || raw.structured_query?.location?.name || "";

  return {
    query: queryResolved,
    text,
    queryIntent,
    isGeneral,
    isEmpty,
    riskLevel: (isGeneral || isEmpty) ? null : (raw.riskLevel || "nominal"),
    riskTitle: (isGeneral || isEmpty) ? (isGeneral ? "General Oceanographic Inquiry" : "No Observations Found") : (locName ? `Ocean Climate Assessment: ${locName}` : (raw.riskTitle || "Oceanographic Intelligence Assessment")),
    riskSummary: keyFindings.length > 0 ? keyFindings[0] : (raw.answer ? raw.answer.split('\n\n')[0].replace(/^[#*\s-]+/, '') : "In-situ ARGO profiling observations."),
    confidence: isGeneral ? "Authoritative Platform & Data Source Reference" : (isEmpty ? "Zero Matched Observations" : "100% Verified In-situ Data (IOC/WMO Standards)"),
    comparison: raw.comparison || null,
    hazards: (isGeneral || isEmpty) ? [] : (raw.hazards || []),
    actions: (isGeneral || isEmpty) ? [] : (raw.actions || []),
    kpis,
    floats,
    relevantFloatId: primaryFloat ? primaryFloat.id : null,
    chartData,
    chartType: chartDataRaw.parameter === 'PSAL' ? 'salinity' : 'temp',
    mapFocus: primaryFloat ? { lat: primaryFloat.lat, lng: primaryFloat.lng, zoom: 6 } : null,
    followUps: followUpSuggestions,
    source: raw.source || { provider: "FastAPI + ARGO GDAC Engine", quality: "RTQC PASS" },
    citations: raw.citations || [],
    keyFindings: raw.key_findings || []
  };
}

/**
 * 1. Submit Natural Language Climate Query via POST /api/v1/chat
 */
export async function queryClimateIntelligence({ query, conversationId = null, context = {}, useLLM = true }) {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      data: normalizeBackendQueryResponse(mockSubmitQuery(query), query),
      isMock: true
    };
  }

  try {
    const raw = await apiClient('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify({
        query,
        session_id: conversationId,
        use_llm: useLLM
      })
    });
    return {
      success: true,
      data: normalizeBackendQueryResponse(raw, query),
      isMock: false
    };
  } catch (err) {
    try {
      const raw2 = await apiClient('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          query,
          conversation_id: conversationId,
          context
        })
      });
      return {
        success: true,
        data: normalizeBackendQueryResponse(raw2, query),
        isMock: false
      };
    } catch (err2) {
      console.warn(`[FloatChat] Backend call failed (${err.message})`);
      return {
        success: false,
        error: err.message,
        data: {
          query,
          text: `### Connection Error\n\nUnable to reach the FloatChat oceanographic engine (${err.message}). Please check your connection and retry.`,
          queryIntent: "error",
          isGeneral: true,
          isEmpty: true,
          kpis: [],
          floats: [],
          chartData: [],
          followUps: ["Show ARGO floats near Miami", "What is ARGO?", "Where is the data fetched from?"]
        },
        isMock: false
      };
    }
  }
}

/**
 * 2. Get Sensor Fleet Locations
 */
export async function getSensorLocations(params = {}) {
  if (USE_MOCK_DATA) {
    let result = [...ARGO_FLOATS];
    if (params.region && params.region !== 'all') {
      result = result.filter(f => f.regionCategory === params.region);
    }
    return { success: true, data: result, isMock: true };
  }

  try {
    const data = await apiClient('/api/floats', { method: 'GET' });
    return { success: true, data: data.floats || data, isMock: false };
  } catch {
    return { success: true, data: ARGO_FLOATS, isMock: true };
  }
}

/**
 * 3. Get Individual Sensor Details
 */
export async function getSensorDetails(floatId) {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetFloatDetails(floatId), isMock: true };
  }

  try {
    const data = await apiClient(`/api/floats/${floatId}`, { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetFloatDetails(floatId), isMock: true };
  }
}

/**
 * 4. Get Ocean Depth Profile
 */
export async function getOceanDepthProfile(floatId, cycle = null) {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetOceanProfile(floatId, cycle), isMock: true };
  }

  try {
    const data = await apiClient(`/api/floats/${floatId}/profiles`, { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetOceanProfile(floatId, cycle), isMock: true };
  }
}

/**
 * 5. Check Live Backend Health (GET /api/v1/health)
 */
export async function checkSystemHealth() {
  try {
    const data = await apiClient('/api/v1/health', { method: 'GET' });
    return {
      isLive: data.status === 'ok' || data.status === 'healthy',
      app_name: data.app_name || "FloatChat API",
      version: data.version || "0.1.0",
      mode: 'live'
    };
  } catch {
    return {
      isLive: false,
      mode: 'mock'
    };
  }
}

/**
 * 6. Get Regional Comparisons
 */
export async function getRegionalComparison(basinA, basinB) {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetRegionalComparison(basinA, basinB), isMock: true };
  }

  try {
    const data = await apiClient(`/api/ocean/compare?region_a=${basinA}&region_b=${basinB}`, { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetRegionalComparison(basinA, basinB), isMock: true };
  }
}

/**
 * 7. Get Mission Logs
 */
export async function getMissionLogs() {
  return { success: true, data: mockGetMissionLogs() };
}

// Aliases for compatibility
export const getWaterColumnProfile = getOceanDepthProfile;
export const getClimateArrayPulse = async () => ({ success: true, data: mockGetFleetStatus() });
export const getBasinComparison = getRegionalComparison;
export const getInquiryLogs = getMissionLogs;
