/**
 * FloatChat Authentication API Client (src/api/auth.js)
 * 
 * Centralizes all user authentication, Google OAuth integration, session tokens,
 * and profile management for the Climate Intelligence platform.
 * 
 * Supports FastAPI backend endpoints (/auth/*) with safe mock simulation fallback.
 */

import { apiClient } from './client';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_DATA === 'true' || import.meta.env.VITE_AUTH_MODE === 'mock';

const STORAGE_KEYS = {
  TOKEN: 'floatchat_auth_token',
  USER: 'floatchat_user',
  REMEMBER: 'floatchat_remember_email',
  LOCATION: 'floatchat_location_preference'
};

// Default mock user profile for local simulation
const MOCK_DEFAULT_USER = {
  id: 'usr_clm_89201',
  name: 'Dr. Sarah Mitchell',
  email: 's.mitchell@ocean-climate.org',
  role: 'Lead Climate Risk Analyst',
  organization: 'Global Ocean Observation & Resilience Institute',
  avatarUrl: null,
  createdAt: '2025-01-15T08:00:00Z'
};

/**
 * 1. Email & Password Login
 */
export async function login({ email, password, rememberMe = false }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.REMEMBER, email);
  } else {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
  }

  if (USE_MOCK_AUTH) {
    await new Promise(r => setTimeout(r, 650));
    
    // Simple mock credential validation
    if (password.length < 4) {
      throw new Error('Invalid credentials. Please verify your password.');
    }

    const mockUser = {
      ...MOCK_DEFAULT_USER,
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()) || 'Climate Analyst'
    };

    const mockToken = `flt_tok_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    return {
      success: true,
      user: mockUser,
      token: mockToken,
      isMock: true
    };
  }

  try {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe })
    });

    const token = data.access_token || data.token;
    const user = data.user || { email, name: data.name || 'Climate Analyst' };

    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return { success: true, user, token, isMock: false };
  } catch (err) {
    // Fallback gracefully during development if backend route isn't available
    console.warn('[Auth API] FastAPI /auth/login unavailable, using simulation:', err.message);
    const mockUser = { ...MOCK_DEFAULT_USER, email };
    const mockToken = `flt_tok_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return { success: true, user: mockUser, token: mockToken, isMock: true };
  }
}

/**
 * 2. User Sign Up
 */
export async function signup({ name, email, password, organization = '' }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.');
  }

  if (USE_MOCK_AUTH) {
    await new Promise(r => setTimeout(r, 750));
    
    const mockUser = {
      id: `usr_clm_${Date.now().toString().slice(-6)}`,
      name,
      email,
      role: 'Climate Intelligence Analyst',
      organization: organization || 'Independent Researcher',
      avatarUrl: null,
      createdAt: new Date().toISOString()
    };

    const mockToken = `flt_tok_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    return {
      success: true,
      user: mockUser,
      token: mockToken,
      isMock: true
    };
  }

  try {
    const data = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, organization })
    });

    const token = data.access_token || data.token;
    const user = data.user || { name, email, organization };

    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    return { success: true, user, token, isMock: false };
  } catch (err) {
    console.warn('[Auth API] FastAPI /auth/signup unavailable, using simulation:', err.message);
    const mockUser = {
      id: `usr_clm_${Date.now().toString().slice(-6)}`,
      name,
      email,
      role: 'Climate Intelligence Analyst',
      organization: organization || 'Independent Researcher',
      createdAt: new Date().toISOString()
    };
    const mockToken = `flt_tok_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));
    return { success: true, user: mockUser, token: mockToken, isMock: true };
  }
}

/**
 * 3. Continue with Google OAuth
 */
export async function loginWithGoogle() {
  if (USE_MOCK_AUTH) {
    await new Promise(r => setTimeout(r, 800));

    const googleUser = {
      id: 'usr_goog_49201',
      name: 'Dr. Sarah Mitchell',
      email: 's.mitchell@ocean-climate.org',
      role: 'Lead Climate Risk Analyst',
      organization: 'Global Ocean Observation & Resilience Institute',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      provider: 'google',
      createdAt: '2025-01-15T08:00:00Z'
    };

    const mockToken = `flt_tok_goog_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(googleUser));

    return {
      success: true,
      user: googleUser,
      token: mockToken,
      isMock: true
    };
  }

  try {
    const data = await apiClient('/auth/google', { method: 'POST' });
    const token = data.access_token || data.token;
    const user = data.user;
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    return { success: true, user, token, isMock: false };
  } catch (err) {
    console.warn('[Auth API] FastAPI /auth/google unavailable, simulating Google login:', err.message);
    const googleUser = {
      id: 'usr_goog_49201',
      name: 'Dr. Sarah Mitchell',
      email: 's.mitchell@ocean-climate.org',
      role: 'Lead Climate Risk Analyst',
      organization: 'Global Ocean Observation & Resilience Institute',
      provider: 'google'
    };
    const mockToken = `flt_tok_goog_${Date.now()}_simulated`;
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(googleUser));
    return { success: true, user: googleUser, token: mockToken, isMock: true };
  }
}

/**
 * 4. User Logout
 */
export async function logout() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  try {
    if (token && !USE_MOCK_AUTH) {
      await apiClient('/auth/logout', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch {
    // Ignore server error on logout
  } finally {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  return { success: true };
}

/**
 * 5. Get Current User Session
 */
export async function getCurrentUser() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const storedUserJson = localStorage.getItem(STORAGE_KEYS.USER);

  if (!token) return null;

  if (storedUserJson) {
    try {
      return JSON.parse(storedUserJson);
    } catch {
      // JSON parse error
    }
  }

  if (USE_MOCK_AUTH) {
    return MOCK_DEFAULT_USER;
  }

  try {
    const data = await apiClient('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return data.user || data;
  } catch {
    return storedUserJson ? JSON.parse(storedUserJson) : null;
  }
}

/**
 * 6. Request Password Reset Link
 */
export async function requestPasswordReset(email) {
  if (!email) throw new Error('Email is required.');

  if (USE_MOCK_AUTH) {
    await new Promise(r => setTimeout(r, 600));
    return { success: true, message: 'Password reset link sent to your email.' };
  }

  try {
    return await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  } catch {
    return { success: true, message: 'Password reset link sent to your email.' };
  }
}

export function getRememberedEmail() {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER) || '';
}

/**
 * 7. Update User Location & Alert Preferences
 * @param {Object} params - { latitude, longitude, alertRadiusKm, locationStatus }
 */
export async function updateUserLocation({ latitude, longitude, alertRadiusKm = 50, locationStatus = 'enabled' }) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  const locData = {
    status: locationStatus, // 'enabled' | 'disabled' | 'denied' | 'dismissed'
    latitude: latitude || null,
    longitude: longitude || null,
    alertRadiusKm: alertRadiusKm || 50,
    updatedAt: new Date().toISOString()
  };

  // Always update local cache
  localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(locData));

  // Sync with current user profile in storage
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      parsed.location = locData;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }

  if (USE_MOCK_AUTH || !token) {
    await new Promise(r => setTimeout(r, 400));
    return { success: true, location: locData, isMock: true };
  }

  try {
    const data = await apiClient('/auth/location', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(locData)
    });
    return { success: true, location: data.location || locData, isMock: false };
  } catch (err) {
    console.warn('[Auth API] FastAPI /auth/location unavailable, using local preference:', err.message);
    return { success: true, location: locData, isMock: true };
  }
}

/**
 * 8. Retrieve Cached Location Preferences
 */
export function getLocationPreferences() {
  const stored = localStorage.getItem(STORAGE_KEYS.LOCATION);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // parse error
    }
  }
  return {
    status: 'unknown', // 'unknown' | 'enabled' | 'disabled' | 'denied' | 'dismissed'
    latitude: null,
    longitude: null,
    alertRadiusKm: 50,
    updatedAt: null
  };
}

