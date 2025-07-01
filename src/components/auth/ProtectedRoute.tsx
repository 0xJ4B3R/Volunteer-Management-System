import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for authentication
    try {
      const role = localStorage.getItem('role');
      const userId = localStorage.getItem('userId');
      const user = localStorage.getItem('user');
      
      console.log('ProtectedRoute checking auth:', { role, userId, hasUser: !!user });
      
      if (role && userId && user) {
        setUserRole(role);
        setIsAuthenticated(true);
        console.log('User authenticated with role:', role);
      } else {
        console.log('User not authenticated, redirecting to login');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    }
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (userRole && !allowedRoles.includes(userRole)) {
    console.log('Redirecting to login - role not allowed:', userRole, 'allowed:', allowedRoles);
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute allowing access for role:', userRole);
  return <>{children}</>;
};

export default ProtectedRoute;