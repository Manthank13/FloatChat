/**
 * FloatChat API Service Entry Point (src/services/api.js)
 * 
 * Centralized export bridge routing to the modular src/api/climateApi.js layer.
 */

export {
  queryClimateIntelligence,
  getSensorLocations,
  getSensorDetails,
  getWaterColumnProfile,
  getClimateArrayPulse,
  getBasinComparison,
  getInquiryLogs,
  checkSystemHealth,
  normalizeBackendQueryResponse
} from '../api/climateApi';

import {
  queryClimateIntelligence,
  getSensorLocations,
  getSensorDetails,
  getWaterColumnProfile,
  getClimateArrayPulse,
  getBasinComparison,
  getInquiryLogs,
  checkSystemHealth
} from '../api/climateApi';

// Backward-compatible named exports for existing components
export const submitOceanQuery = queryClimateIntelligence;
export const getFloatLocations = getSensorLocations;
export const getFloatDetails = getSensorDetails;
export const getOceanProfile = getWaterColumnProfile;
export const getFleetStatus = getClimateArrayPulse;
export const getRegionalComparison = getBasinComparison;
export const getMissionLogs = getInquiryLogs;
export const checkBackendHealth = checkSystemHealth;
export const healthCheck = checkSystemHealth;
export const getNearbyFloats = async () => ({ success: true, data: [] });
