// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);

    // Check for token expiration
    if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/signin" replace />;
    }

    // Check if the user has one of the allowed roles
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decodedToken.role)) {
      return <Navigate to="/not-authorized" replace />;
    }

    // If authenticated and authorized, render the child route
    return <Outlet />;
  } catch (error) {
    // Handle invalid token (e.g., malformed JWT)
    localStorage.removeItem('token');
    return <Navigate to="/signin" replace />;
  }
};

export default PrivateRoute;

