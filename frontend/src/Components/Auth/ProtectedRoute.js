import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user, loading, isAuthenticated, hasRole } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If role is required and user doesn't have it, redirect to appropriate dashboard
    if (requiredRole && !hasRole(requiredRole)) {
        if (hasRole('Branch Manager')) {
            return <Navigate to="/branch-manager" replace />;
        } else if (hasRole('Factory Manager')) {
            return <Navigate to="/factory-manager" replace />;
        } else if (hasRole('Admin')) {
            return <Navigate to="/admin-dashboard" replace />;
        } else if (hasRole('Customer')) {
            return <Navigate to="/customer-dashboard" replace />;
        } else if (hasRole('Driver')) {
            return <Navigate to="/driver-dashboard" replace />;
        } else if (hasRole('Fire Brigade')) {
            return <Navigate to="/fire-brigade-dashboard" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
