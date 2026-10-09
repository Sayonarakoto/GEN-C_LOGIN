import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageLoader from './common/PageLoader';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <PageLoader label="Restoring your session..." />;
    }

    if (!user) {
        // Not signed in (or session ended) → send home to sign in, never to the error page
        return <Navigate to="/" replace />;
    }

    // Normalize both the user role and the allowed roles to UPPERCASE
    // This allows the check to pass regardless of the backend's casing inconsistency.
    const userRole = user.role ? user.role.toUpperCase() : '';
    const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());

    if (allowedRoles && !allowedRolesUpper.includes(userRole)) {
        // Signed in but with the wrong role → genuine access-denied page
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
