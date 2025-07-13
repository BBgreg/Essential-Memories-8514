import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Add debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isAuthenticated: !!user, 
      isLoading: loading,
      userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none'
    });
  }, [user, loading]);
  
  // If we're still loading for less than 8 seconds, don't render anything yet
  // The LoadingScreen will be shown by Layout
  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    console.log('ProtectedRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the protected component
  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;