import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { setAuthLogoutCallback } from '../utils/authUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Initialize token to null
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Effect to load token from sessionStorage once on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false); // If no token, stop loading immediately
    }
  }, []); // Empty dependency array to run only once on mount

  const logout = useCallback((redirectPath = '/') => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    // Perform redirection after state is cleared
    if (redirectPath && typeof window !== 'undefined') {
      // Use React Router navigation instead of window.location.href
      navigate(redirectPath); 
    }
  }, [navigate]);

  useEffect(() => {
    // Set the global callback when the component mounts
    setAuthLogoutCallback(logout);

    // Clean up the global callback when the component unmounts
    return () => {
      setAuthLogoutCallback(null);
    };
  }, [logout]); // Empty dependency array means this runs once on mount and unmount

  useEffect(() => {
    console.log('AuthContext useEffect: Token state changed or component mounted.');
    if (token) {
      console.log('AuthContext useEffect: Token found, attempting to validate.');
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        console.log('AuthContext useEffect: Decoded token:', decoded);
        console.log('AuthContext useEffect: Token expiration (exp):', decoded.exp);
        console.log('AuthContext useEffect: Current time:', currentTime);

        if (decoded.exp && decoded.exp > currentTime) {
          if (decoded.id && decoded.role && decoded.name) {
            console.log('AuthContext useEffect: Token is valid and not expired.');
            setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
          } else {
            console.log('AuthContext useEffect: Token is invalid (missing fields), clearing token.');
            // Token is invalid, clear it
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null); // Explicitly set user to null
          }
        } else {
          console.log('AuthContext useEffect: Token is expired, clearing token.');
          // Token is expired, clear it
          sessionStorage.removeItem('token');
          setToken(null);
          setUser(null); // Explicitly set user to null
        }
      } catch (err) {
        console.error('AuthContext useEffect: Token validation failed:', err);
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null); // Explicitly set user to null
      }
    } else { // If token is null initially, ensure user is also null
      console.log('AuthContext useEffect: No token found, ensuring user is null.');
      setUser(null);
    }
    console.log('AuthContext useEffect: Setting loading to false.');
    setLoading(false);
  }, [token]);

  const login = (newToken) => {
    console.log('AuthContext: login function called.'); // Add this log
    try {
      const decoded = jwtDecode(newToken);
      if (!decoded.id || !decoded.role || !decoded.name || !decoded.exp) {
        throw new Error('Invalid token: missing required fields');
      }
      sessionStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
    } catch (error) {
      console.error('Login failed:', error);
      sessionStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };