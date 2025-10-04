import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    if (!user) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 🛑 CRITICAL FIX: Normalize both the user role and the allowed roles to UPPRECASE
    // This allows the check to pass regardless of the backend's casing inconsistency.
    const userRole = user.role ? user.role.toUpperCase() : '';
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());


    if (allowedRoles && !allowedRolesUpper.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
