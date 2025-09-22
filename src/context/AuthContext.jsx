import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp > currentTime) {
          if (decoded.id && decoded.role && decoded.name) {
            setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } else {
          // Token is expired, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = (newToken) => {
    try {
      const decoded = jwtDecode(newToken);
      if (!decoded.id || !decoded.role || !decoded.name || !decoded.exp) {
        throw new Error('Invalid token: missing required fields');
      }
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthContext, AuthProvider, useAuth };
