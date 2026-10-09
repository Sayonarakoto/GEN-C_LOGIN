import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';
import { tokenStore } from '../utils/tokenStore';

const AuthContext = createContext();

// Refresh this long before the access token expires
const REFRESH_LEAD_MS = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const decodeSafe = (t) => {
    try {
      return jwtDecode(t);
    } catch {
      return null;
    }
  };

  // Helper to extract and standardize user data from token
  const extractUserData = (t) => {
    const decoded = jwtDecode(t);
    if (!decoded.id || !decoded.role || !decoded.fullName || !decoded.department) {
      throw new Error('Invalid token payload: missing ID, role, fullName, or department.');
    }
    return {
      id: decoded.id,
      role: decoded.role,
      fullName: decoded.fullName,
      department: decoded.department,
      year: decoded.year,
      studentId: decoded.studentId,
      email: decoded.email,
      profilePictureUrl: decoded.profilePictureUrl,
      facultyId: decoded.facultyId || decoded.employeeId,
      designation: decoded.designation,
      departmentId: decoded.departmentId || decoded.department,
      exp: decoded.exp
    };
  };

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  // Exchange the refresh token for a new access token (silent session renewal)
  const refreshSession = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      if (!data?.token) return false;
      tokenStore.setToken(data.token);
      if (data.refreshToken) tokenStore.setRefreshToken(data.refreshToken);
      const userData = extractUserData(data.token);
      setUser((prev) => (prev ? { ...userData } : userData));
      setToken(data.token);
      scheduleRefresh(data.token);
      return true;
    } catch (err) {
      console.warn('Silent token refresh failed:', err?.response?.status || err?.message);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the session alive: refresh REFRESH_LEAD_MS before expiry, repeatedly
  const scheduleRefresh = useCallback((currentToken) => {
    clearRefreshTimer();
    const decoded = decodeSafe(currentToken);
    if (!decoded?.exp) return;
    const msUntilExpiry = decoded.exp * 1000 - Date.now();
    const fireIn = Math.max(msUntilExpiry - REFRESH_LEAD_MS, 5000);
    refreshTimer.current = setTimeout(async () => {
      const ok = await refreshSession();
      if (ok) {
        scheduleRefresh(tokenStore.getToken());
      } else {
        // Refresh token missing/expired: leave state as-is; interceptor or next boot handles logout
        clearRefreshTimer();
      }
    }, fireIn);
  }, [refreshSession]);

  const logout = useCallback(() => {
    clearRefreshTimer();
    setUser(null);
    setToken(null);
    tokenStore.clear();
    window.location.replace('/');
  }, []);

  // Boot: hydrate from storage; if access token expired but refresh token exists, renew silently
  useEffect(() => {
    console.log('AuthContext: STARTING token rehydration.');
    const stored = tokenStore.getToken();
    const storedRefresh = tokenStore.getRefreshToken();
    const decoded = decodeSafe(stored);
    const now = Date.now() / 1000;

    if (decoded && decoded.exp > now) {
      setUser(extractUserData(stored));
      setToken(stored);
      scheduleRefresh(stored);
      setLoading(false);
    } else if (storedRefresh) {
      // Access token expired (e.g. tab reopened after a break) → silent refresh
      refreshSession().then((ok) => {
        if (!ok) {
          tokenStore.clear();
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });
    } else {
      tokenStore.clear();
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when the user returns to the tab and the session is near expiry
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const stored = tokenStore.getToken();
      const decoded = decodeSafe(stored);
      if (!decoded?.exp) return;
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn < 2 * 60 * 1000) {
        refreshSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshSession]);

  // Cleanup timer on unmount
  useEffect(() => () => clearRefreshTimer(), []);

  const login = (newToken, userDataFromAPI, refreshToken) => {
    try {
      const userData = extractUserData(newToken);
      const finalUserData = {
        ...userData,
        ...userDataFromAPI,
      };

      tokenStore.setToken(newToken);
      if (refreshToken) tokenStore.setRefreshToken(refreshToken);
      setToken(newToken);
      setUser(finalUserData);
      scheduleRefresh(newToken);

      console.log('AuthContext: FINAL ROLE SET IN STATE:', finalUserData.role);
    } catch (error) {
      console.error('Login failed:', error);
      tokenStore.clear();
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, updateUser, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
