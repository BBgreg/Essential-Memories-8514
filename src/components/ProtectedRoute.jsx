import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] Current state:', {
    isAuthenticated: !!user,
    isLoading: loading,
    userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none'
  });

  if (loading) {
    console.log('[ProtectedRoute] Auth still loading, showing loading screen');
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-text-primary">Checking authentication...</p>
          <p className="text-sm text-text-secondary">This should only take a moment...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;