import { useState, useEffect, useCallback } from 'react';
import { 
  login as apiLogin, 
  signup as apiSignup, 
  loginWithGoogle as apiGoogleLogin, 
  logout as apiLogout, 
  getCurrentUser,
  requestPasswordReset,
  updateUserLocation,
  getLocationPreferences
} from '../api/auth';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPreference, setLocationPreference] = useState(() => getLocationPreferences());

  // Initialize and verify existing session
  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (currentUser.location) {
            setLocationPreference(currentUser.location);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Session verification failed:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password, rememberMe });
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.location) {
          setLocationPreference(res.user.location);
        }
        return { success: true, user: res.user };
      }
      throw new Error(res.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ name, email, password, organization }) => {
    setLoading(true);
    try {
      const res = await apiSignup({ name, email, password, organization });
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      throw new Error(res.error || 'Account creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await apiGoogleLogin();
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.location) {
          setLocationPreference(res.user.location);
        }
        return { success: true, user: res.user };
      }
      throw new Error(res.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email) => {
    return await requestPasswordReset(email);
  };

  // Update Location & Alert Preferences
  const updateLocationPref = useCallback(async ({ latitude, longitude, alertRadiusKm, locationStatus }) => {
    const res = await updateUserLocation({ latitude, longitude, alertRadiusKm, locationStatus });
    if (res.success && res.location) {
      setLocationPreference(res.location);
      setUser(prev => prev ? { ...prev, location: res.location } : prev);
    }
    return res;
  }, []);

  // Request browser location permission
  const requestLocationPermission = useCallback(async (customRadius = 50) => {
    if (!navigator.geolocation) {
      const fallback = {
        status: 'unsupported',
        latitude: null,
        longitude: null,
        alertRadiusKm: customRadius,
        error: 'Browser does not support geolocation'
      };
      await updateLocationPref(fallback);
      return { success: false, error: 'Geolocation is not supported by your browser.', preference: fallback };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const pref = {
            latitude: lat,
            longitude: lng,
            alertRadiusKm: customRadius,
            locationStatus: 'enabled'
          };
          const res = await updateLocationPref(pref);
          resolve({ success: true, coords: { latitude: lat, longitude: lng }, preference: res.location });
        },
        async (error) => {
          let status = 'denied';
          let message = 'Location access was denied.';
          if (error.code === error.TIMEOUT) {
            message = 'Location request timed out.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable.';
          }
          const pref = {
            latitude: null,
            longitude: null,
            alertRadiusKm: customRadius,
            locationStatus: status
          };
          await updateLocationPref(pref);
          resolve({ success: false, error: message, code: error.code, preference: pref });
        },
        { timeout: 12000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    });
  }, [updateLocationPref]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    locationPreference,
    login,
    signup,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    updateLocationPreference: updateLocationPref,
    requestLocationPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
