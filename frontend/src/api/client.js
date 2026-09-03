/**
 * FloatChat Base API Client (src/api/client.js)
 * 
 * Provides a resilient fetch wrapper with automatic timeouts, header management,
 * and unified error normalization.
 */

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  // If running in browser on deployed Vercel domain, connect directly to production Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://floatchat-2ckd.onrender.com';
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = resolveApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 25000;

/**
 * Custom API Error with structured status and details
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Core request dispatcher
 * @param {string} endpoint - API path relative to BASE_URL (e.g. '/api/query')
 * @param {Object} options - Fetch options (method, headers, body)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    signal: controller.signal
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      throw new ApiError(
        errorData?.detail || errorData?.message || `HTTP error ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out while connecting to Climate Intelligence service', 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failure', 0, null);
  }
}
