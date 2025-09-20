import React, { createContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import { setAuthToken } from './auth-hooks'; // Import setAuthToken from auth-hooks

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, role, name }
  const [loading] = useState(false); // Initialize loading to false. setLoading will be reintroduced with new auth flow.

  const login = (token) => { // login now expects a token
    setAuthToken(token); // Store token using the utility function
    const decodedToken = jwtDecode(token); // Decode the token
    setUser({ id: decodedToken.id, role: decodedToken.role, name: decodedToken.name }); // Set user data from decoded token
  };

  const logout = () => {
    setAuthToken(null); // Clear token using the utility function
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }} >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };

