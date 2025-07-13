import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMemory } from '../contexts/MemoryContext';
import Navbar from './Navbar';
import ConfettiBackground from './ConfettiBackground';
import LoadingScreen from './LoadingScreen';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshSession } from '../lib/supabase';

const Layout = ({ children }) => {
  const { loading: authLoading, user, authError } = useAuth();
  const { loading: memoryLoading, error: memoryError } = useMemory();
  const location = useLocation();
  const navigate = useNavigate();

  // Track how long we've been in the loading state
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Force exit from loading state after maximum time
  const [forceExit, setForceExit] = useState(false);
  
  // Don't show loading screen on auth pages
  const isAuthPage = [
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/terms',
    '/privacy'
  ].includes(location.pathname);

  // Force login redirect if auth check completes and no user is found (for protected routes)
  useEffect(() => {
    const isProtectedRoute = ![
      '/login',
      '/signup',
      '/forgot-password',
      '/update-password',
      '/terms',
      '/privacy'
    ].includes(location.pathname);

    if (!authLoading && !user && isProtectedRoute) {
      console.log('[Layout] Not loading and no user found for protected route, redirecting to login');
      navigate('/login');
    }
  }, [authLoading, user, location.pathname, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('[Layout] Render state:', {
      path: location.pathname,
      isAuthPage,
      authLoading,
      memoryLoading,
      hasUser: !!user,
      authError: authError ? 'Error present' : 'None',
      memoryError: memoryError ? 'Error present' : 'None',
      forceExit,
      loadingDuration
    });
  }, [
    location.pathname,
    isAuthPage,
    authLoading,
    memoryLoading,
    user,
    authError,
    memoryError,
    forceExit,
    loadingDuration
  ]);

  // Track loading duration and force exit if needed
  useEffect(() => {
    // Only track loading time if we're actually in a loading state
    if ((authLoading || (memoryLoading && user)) && !isAuthPage) {
      const interval = setInterval(() => {
        setLoadingDuration(prev => {
          const newDuration = prev + 1;
          
          // Try to refresh the session at 3 seconds if we're still loading
          if (newDuration === 3) {
            console.log('[Layout] Loading taking too long, attempting session refresh...');
            refreshSession().catch(err => {
              console.error('[Layout] Session refresh failed:', err.message);
            });
          }
          
          // Force exit from loading state after 6 seconds
          if (newDuration >= 6 && !forceExit) {
            console.warn('[Layout] Forcing exit from loading state after timeout');
            setForceExit(true);
          }
          
          return newDuration;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset loading duration when we're not loading
      setLoadingDuration(0);
    }
  }, [authLoading, memoryLoading, user, isAuthPage, forceExit]);

  // Retry function for auth errors
  const handleRetry = () => {
    console.log('[Layout] Retry requested, refreshing session and page');
    
    // First try to refresh the session
    refreshSession()
      .then(success => {
        console.log('[Layout] Session refresh attempt result:', success);
        
        if (!success) {
          // If session refresh fails, force reload the page
          window.location.reload();
        }
      })
      .catch(() => {
        // On any error, force reload
        window.location.reload();
      });
  };

  // Show loading screen only when necessary
  const showLoading = !isAuthPage && !forceExit && (authLoading || (memoryLoading && user));
  
  // Show error only on protected pages
  const showError = !isAuthPage && (authError || memoryError);
  
  // Error message to display
  const errorMessage = authError || memoryError || "There was a problem loading the app.";
  
  // Dynamic loading message based on state
  const loadingMessage = authLoading
    ? "Checking authentication..."
    : memoryLoading
    ? "Loading your memories..."
    : "Initializing app...";

  return (
    <div className="app-container min-h-screen relative">
      <ConfettiBackground />
      
      {showLoading && (
        <LoadingScreen 
          message={loadingMessage} 
          onRetry={handleRetry} 
          showRetry={loadingDuration > 3} 
        />
      )}
      
      {showError && (
        <LoadingScreen 
          error={errorMessage} 
          onRetry={handleRetry} 
          showRetry={true} 
        />
      )}
      
      {(!showLoading && !showError) || forceExit ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <main className="pb-20">{children}</main>
          {!isAuthPage && <Navbar />}
        </motion.div>
      ) : null}
    </div>
  );
};

export default Layout;