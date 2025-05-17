import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, useAuthorization } from '../context/AuthContext';

interface PrivateRouteProps {
  requiredRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  requiredRoles = ['admin', 'reviewer', 'user']
}) => {
  const { isAuthenticated } = useAuth();
  const isAuthorized = useAuthorization(requiredRoles);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but not authorized, redirect to dashboard
  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }
  
  // If authenticated and authorized, render the protected route
  return <Outlet />;
};

export default PrivateRoute; 