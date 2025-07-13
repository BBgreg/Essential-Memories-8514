import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import supabase from '../lib/supabase';
import { refreshSession } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Add debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] State:', {
      isAuthenticated: !!user,
      isLoading: loading,
      userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none'
    });
    
    // If we have a user but somehow auth is still loading, attempt to force refresh
    if (user && loading) {
      console.log('[ProtectedRoute] User exists but loading is still true, attempting refresh...');
      refreshSession().then(success => {
        console.log('[ProtectedRoute] Session refresh attempt result:', success);
      });
    }
    
    // Debug check for current session
    const checkCurrentSession = async () => {
      const session = await supabase.auth.getSession();
      console.log('[ProtectedRoute] Current session check:', !!session.data.session);
    };
    
    checkCurrentSession();
  }, [user, loading]);

  // If we're still loading, show the loading screen
  if (loading) {
    console.log('[ProtectedRoute] Still loading auth state, showing loading screen');
    return <LoadingScreen message="Verifying your authentication..." />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log('[ProtectedRoute] No authenticated user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  console.log('[ProtectedRoute] User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;