import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

// This component checks if the user has the required role to access a route
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Get the user role from localStorage
    const userRole = localStorage.getItem('role');
    console.log("ProtectedRoute checking - User role from localStorage:", userRole);
    console.log("ProtectedRoute checking - Allowed roles:", allowedRoles);

    // Check if the user's role is included in the allowed roles
    const isAuthorized = userRole && allowedRoles.includes(userRole);
    console.log("ProtectedRoute result - Is authorized:", isAuthorized);

    setAuthorized(isAuthorized);
    setLoading(false);
  }, [allowedRoles]);

  if (loading) {
    // Show a loading indicator while checking authorization
    return <div>Loading...</div>;
  }

  // If not authorized, redirect to login
  if (!authorized) {
    console.log("Not authorized, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If authorized, render the children
  return children;
};

export default ProtectedRoute;
