import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Initialize token to null
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    window.location.replace('/');
  }, []);

  useEffect(() => {
    console.log('AuthContext: STARTING token rehydration.');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedToken) {
        setToken(storedToken); // Set token in state for other logic that relies on the token value
        try {
            const decoded = jwtDecode(storedToken);
            const currentTime = Date.now() / 1000;

            if (decoded.exp && decoded.exp > currentTime) {
                // Token is VALID
                setUser({ id: decoded.id, role: decoded.role, name: decoded.name });
                console.log('AuthContext: Token is valid. User set.');
            } else {
                // Token is EXPIRED
                sessionStorage.removeItem('token');
                setToken(null);
                setUser(null); 
                console.log('AuthContext: Token expired. Cleared session.');
            }
        } catch (err) {
            // Token is MALFORMED/INVALID
            console.error('AuthContext: Invalid token on decode. Clearing session.');
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    } else {
        // No token found initially
        setToken(null);
        setUser(null);
        console.log('AuthContext: No token found. Session cleared.');
    }
    
    // 💥 CRITICAL: This MUST be the very last action of the entire sequence.
    console.log('AuthContext: Setting loading to false (FINAL).');
    setLoading(false); 

  // The empty array means this runs only ONCE when the component mounts.
  }, []);

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