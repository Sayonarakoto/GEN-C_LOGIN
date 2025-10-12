import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ℹ️ Helper function to extract and standardize user data from token
  const extractUserData = (token) => {
    const decoded = jwtDecode(token);
    if (!decoded.id || !decoded.role || !decoded.fullName || !decoded.department) {
      // 🛑 CRITICAL FIX: Ensure 'department' is mandatory for RBAC
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
      facultyId: decoded.facultyId || decoded.employeeId, // Use employeeId as fallback for facultyId
      designation: decoded.designation, // ADD THIS LINE
      departmentId: decoded.departmentId || decoded.department,
      exp: decoded.exp
    };
  };

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
        setToken(storedToken);
        try {
            const userData = extractUserData(storedToken);
            const currentTime = Date.now() / 1000;

            if (userData.exp && userData.exp > currentTime) {
                // Token is VALID
                setUser(userData); // ✅ FIX: Use the complete userData object
                console.log('AuthContext: Token is valid. User set (Role/Dept confirmed).');
            } else {
                // Token is EXPIRED
                sessionStorage.removeItem('token');
                setToken(null);
                setUser(null);
                console.log('AuthContext: Token expired. Cleared session.');
            }
        } catch (err) {
            // Token is MALFORMED/INVALID
            console.error('AuthContext: Invalid token on decode. Clearing session.', err);
            sessionStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    } else {
        console.log('AuthContext: No token found. Session cleared.');
    }

    console.log('AuthContext: Setting loading to false (FINAL).');
    setLoading(false);
  }, []); // Removed logout from dependencies as it's wrapped in useCallback and doesn't need to trigger re-run

  const login = (newToken, userDataFromAPI) => { // Accept the user object from the API
    console.log('AuthContext: login function called.');
    try {
      // 1. Save the token and use the token's payload for the official user state
      const userData = extractUserData(newToken);

      // 2. CRITICAL: Use the role from the token for the final user state
      //    We combine the token data with any extra data the API provided.
      const finalUserData = {
          ...userDataFromAPI, // Use the fresh data from the API response
          ...userData,        // Override role/id/etc. with the definitive token data
      };

      sessionStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(finalUserData); // Set the full, correct user data

      // Log the final role for debugging the subsequent redirect
      console.log('AuthContext: FINAL ROLE SET IN STATE:', finalUserData.role);

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
