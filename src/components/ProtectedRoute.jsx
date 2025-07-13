import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Add debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isAuthenticated: !!user, 
      isLoading: loading,
      userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none'
    });
  }, [user, loading]);
  
  // If we're still loading, don't render anything yet
  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return null; // The LoadingScreen will be shown by Layout
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