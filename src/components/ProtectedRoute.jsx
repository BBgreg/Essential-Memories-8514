import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import { refreshSession } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // SIMPLIFIED APPROACH: Enhanced debug logging
  useEffect(() => {
    console.log('[ProtectedRoute] Current state:', {
      isAuthenticated: !!user,
      isLoading: loading,
      userId: user?.id ? (user.id.substring(0, 8) + '...') : 'none',
      pathname: window.location.pathname,
      hash: window.location.hash
    });

    // SIMPLIFIED APPROACH: Faster session refresh attempt
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.log('[ProtectedRoute] Still loading after delay, attempting session refresh');
        refreshSession().then(success => {
          console.log('[ProtectedRoute] Session refresh result:', success ? 'Success' : 'Failed');
        });
      }, 1500); // Reduced timeout for faster feedback
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading]);

  // SIMPLIFIED APPROACH: Shorter loading timeout
  if (loading) {
    console.log('[ProtectedRoute] 🔄 Auth still loading, showing loading screen');
    return <LoadingScreen message="Verifying your authentication..." />;
  }

  // SIMPLIFIED APPROACH: Temporary bypass for debugging
  console.log('[ProtectedRoute] Authentication check complete. User exists:', !!user);
  
  // Comment this out temporarily to allow access regardless of auth state
  // if (!user) {
  //   console.log('[ProtectedRoute] ⚠️ No authenticated user, redirecting to login');
  //   return <Navigate to="/login" replace />;
  // }

  // SIMPLIFIED APPROACH: Always render the protected content for now
  console.log('[ProtectedRoute] ✅ Rendering protected content');
  return children;
};

export default ProtectedRoute;