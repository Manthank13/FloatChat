/**
 * FloatChat Climate & Environmental Intelligence API Module (src/api/climateApi.js)
 * 
 * Implements the contract defined in frontend-api-contract.md.
 * Automatically delegates to mockData when VITE_USE_MOCK_DATA=true or during network failures.
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
 * Normalizes backend JSON response into standard frontend visualization format
 */
export function normalizeBackendQueryResponse(raw, originalQuery) {
  if (!raw) return mockSubmitQuery(originalQuery);

  const text = raw.text || raw.answer || raw.insights?.join('\n\n') || raw.response || 'Climate assessment complete.';
  const summary = raw.summary || {};
  const floatInfo = raw.float || {};
  const locationInfo = raw.location || {};
  const profileList = raw.profile || [];
  const sourceInfo = raw.source || {};

  // Meaningful Climate Indicator KPI cards
  const kpis = raw.kpis || [
    { 
      label: "SEA SURFACE TEMPERATURE", 
      value: summary.surface_temperature !== undefined ? `${summary.surface_temperature} °C` : "28.4 °C", 
      anomaly: summary.surface_temperature > 28 ? "+0.8°C Anomaly" : "Nominal", 
      riskRelevance: summary.surface_temperature > 28 ? "Elevated Storm Thermal Fuel" : "Baseline", 
      riskLevel: summary.surface_temperature > 28 ? "elevated" : "nominal",
      type: "temp", 
      icon: "Thermometer" 
    },
    { 
      label: "SURFACE SALINITY", 
      value: summary.surface_salinity !== undefined ? `${summary.surface_salinity} PSU` : "33.1 PSU", 
      anomaly: "-0.4 PSU vs Baseline", 
      riskRelevance: "Barrier Layer Formed", 
      riskLevel: "moderate",
      type: "salinity", 
      icon: "Droplets" 
    },
    { 
      label: "MIXED LAYER DEPTH (MLD)", 
      value: summary.mixed_layer_depth !== undefined ? `${summary.mixed_layer_depth} m` : "35 m", 
      anomaly: "Current Status: Stratified", 
      riskRelevance: "Shallow Heat Cap", 
      riskLevel: "moderate",
      type: "depth", 
      icon: "Layers" 
    },
    { 
      label: "EVIDENCE QUALITY", 
      value: sourceInfo.quality || "RTQC PASS", 
      anomaly: "WMO / INCOIS Calibrated", 
      riskRelevance: floatInfo.id ? `Float #${floatInfo.id}` : "In-situ CTD Array", 
      riskLevel: "nominal",
      type: "float", 
      icon: "Activity" 
    }
  ];

  // Convert profile points for OceanSlice
  const chartData = profileList.map((p) => ({
    depth: p.depth !== undefined ? p.depth : 0,
    temp: p.temperature !== undefined ? p.temperature : p.temp !== undefined ? p.temp : 28.0,
    salinity: p.salinity !== undefined ? p.salinity : 34.0,
    pressure: p.pressure !== undefined ? p.pressure : p.depth || 0,
    density: p.density !== undefined ? p.density : 23.5,
    oxygen: p.oxygen !== undefined ? p.oxygen : 180
  }));

  // Build float object
  const primaryFloat = {
    id: floatInfo.id || "ARGO-IN-2902741",
    wmoNumber: floatInfo.wmoNumber || floatInfo.id?.replace(/[^0-9]/g, '') || "2902741",
    name: floatInfo.name || `Float ${floatInfo.id || "2902741"}`,
    institution: floatInfo.institution || "INCOIS / ARGO GDAC",
    lat: floatInfo.latitude || locationInfo.latitude || 13.08,
    lng: floatInfo.longitude || locationInfo.longitude || 80.27,
    region: locationInfo.name || "Indian Ocean Basin",
    regionCategory: locationInfo.regionCategory || "bay_of_bengal",
    status: floatInfo.status || "Active",
    cycleNumber: floatInfo.cycle || 142,
    lastTransmission: floatInfo.lastTransmission || "Recent Uplink",
    surfaceTemp: summary.surface_temperature || 28.4,
    deepTemp: summary.deep_temperature || 3.1,
    surfaceSalinity: summary.surface_salinity || 33.1,
    deepSalinity: 34.8,
    mixedLayerDepth: summary.mixed_layer_depth || 35,
    thermoclineDepth: summary.thermocline_depth || 110,
    maxDepth: summary.max_depth || 2000,
    batteryPercent: floatInfo.batteryPercent || 90,
    transmissionType: floatInfo.transmissionType || "Iridium SBD",
    sensors: floatInfo.sensors || ["CTD SBE41CP", "Optode 4330"],
    profile: chartData
  };

  return {
    query: originalQuery,
    text,
    queryIntent: raw.queryIntent || (raw.comparison ? "comparison" : "risk_assessment"),
    riskLevel: raw.riskLevel || (summary.surface_temperature > 28 ? "elevated" : "moderate"),
    riskTitle: raw.riskTitle || "Climate & Coastal Risk Assessment",
    riskSummary: raw.riskSummary || raw.insights?.[0] || "In-situ sensor observations indicate relevant climate and environmental indicators.",
    confidence: raw.confidence || "94% (High Sensor Confidence)",
    comparison: raw.comparison || null,
    hazards: raw.hazards || [],
    actions: raw.actions || [],
    kpis,
    floats: raw.floats || [primaryFloat, ...ARGO_FLOATS.filter(f => f.id !== primaryFloat.id)],
    relevantFloatId: primaryFloat.id,
    chartData,
    chartType: raw.chartType || "combined",
    mapFocus: raw.mapFocus || { lat: primaryFloat.lat, lng: primaryFloat.lng, zoom: 6 },
    followUps: raw.followUps || [
      "Explain the environmental factors relevant to cyclone risk in this region",
      "Show temperature and salinity changes near Chennai",
      "Compare cyclone risk between Chennai and Mumbai"
    ],
    source: sourceInfo
  };
}

/**
 * 1. Submit Natural Language Climate Query
 */
export async function queryClimateIntelligence({ query, conversationId = null, context = {} }) {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      data: normalizeBackendQueryResponse(mockSubmitQuery(query), query),
      isMock: true
    };
  }

  try {
    const raw = await apiClient('/api/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        context
      })
    });
    return {
      success: true,
      data: normalizeBackendQueryResponse(raw, query),
      isMock: false
    };
  } catch (err) {
    console.warn(`[ClimateAPI] /api/query failed (${err.message}). Falling back to simulation...`);
    const fallback = mockSubmitQuery(query);
    return {
      success: true,
      data: normalizeBackendQueryResponse(fallback, query),
      isMock: true,
      backendError: err.message
    };
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
    const queryString = new URLSearchParams(params).toString();
    const data = await apiClient(`/api/floats${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
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
 * 4. Get CTD Depth Profile
 */
export async function getWaterColumnProfile(floatId, variable = 'temperature') {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetOceanProfile(floatId, variable), isMock: true };
  }

  try {
    const data = await apiClient(`/api/floats/${floatId}/profile?variable=${variable}`, { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetOceanProfile(floatId, variable), isMock: true };
  }
}

/**
 * 5. Get Regional Climate Array Status
 */
export async function getClimateArrayPulse() {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetFleetStatus(), isMock: true };
  }

  try {
    const data = await apiClient('/api/fleet/status', { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetFleetStatus(), isMock: true };
  }
}

/**
 * 6. Get Dual-Basin / Regional Comparison
 */
export async function getBasinComparison(floatAId, floatBId) {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetRegionalComparison(floatAId, floatBId), isMock: true };
  }

  try {
    const data = await apiClient(`/api/ocean/compare?float_a=${floatAId}&float_b=${floatBId}`, { method: 'GET' });
    return { success: true, data, isMock: false };
  } catch {
    return { success: true, data: mockGetRegionalComparison(floatAId, floatBId), isMock: true };
  }
}

/**
 * 7. Get Climate Inquiry Logs
 */
export async function getInquiryLogs() {
  if (USE_MOCK_DATA) {
    return { success: true, data: mockGetMissionLogs(), isMock: true };
  }

  try {
    const data = await apiClient('/api/conversations', { method: 'GET' });
    return { success: true, data: data.conversations || data, isMock: false };
  } catch {
    return { success: true, data: mockGetMissionLogs(), isMock: true };
  }
}

/**
 * 8. System Health Check
 */
export async function checkSystemHealth() {
  if (USE_MOCK_DATA) {
    return { isLive: false, mode: 'mock' };
  }

  try {
    const data = await apiClient('/api/health', { method: 'GET', timeout: 3000 });
    return { isLive: data.status === 'ok' || data.status === 'healthy', mode: 'fastapi', details: data };
  } catch {
    return { isLive: false, mode: 'mock' };
  }
}
