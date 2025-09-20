import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth-hooks';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth(); // Get the user object and loading state from the AuthContext

    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    // Check if the user is authenticated at all
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Check if the user has one of the allowed roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // If authenticated and authorized, render the child route
    return <Outlet />;
};

export default ProtectedRoute;