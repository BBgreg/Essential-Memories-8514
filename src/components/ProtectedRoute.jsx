import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import { refreshSession } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Enhanced debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] Current state:', {
      isAuthenticated: !!user,
      isLoading: loading,
      userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none',
      pathname: window.location.pathname,
      hash: window.location.hash
    });
    
    // If we're stuck in a loading state for too long, try refreshing the session
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.log('[ProtectedRoute] Still loading after delay, attempting session refresh');
        refreshSession().then(success => {
          console.log('[ProtectedRoute] Session refresh result:', success ? 'Success' : 'Failed');
        });
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading]);

  // If still in loading state, show a loading screen
  if (loading) {
    console.log('[ProtectedRoute] 🔄 Auth still loading, showing loading screen');
    return <LoadingScreen message="Verifying your authentication..." />;
  }

  // If authentication check is complete and no user is found, redirect to login
  if (!user) {
    console.log('[ProtectedRoute] ⚠️ No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected content
  console.log('[ProtectedRoute] ✅ User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;