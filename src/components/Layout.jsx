import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMemory } from '../contexts/MemoryContext';
import Navbar from './Navbar';
import ConfettiBackground from './ConfettiBackground';
import LoadingScreen from './LoadingScreen';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { loading: authLoading, user, authError } = useAuth();
  const { 
    loading: memoryLoading, 
    error: memoryError, 
    dataFetchAttempted, 
    retryLoadMemories 
  } = useMemory();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Track how long we've been in the loading state
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Force exit from loading state after 10 seconds max
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

    if ((!authLoading || forceExit) && !user && isProtectedRoute) {
      console.log('No authenticated user found, redirecting to login page');
      navigate('/login');
    }
  }, [authLoading, user, location.pathname, navigate, forceExit]);

  // Debug logging
  useEffect(() => {
    console.log('Layout render state:', {
      isAuthPage,
      authLoading,
      memoryLoading,
      hasUser: !!user,
      memoryError,
      dataFetchAttempted,
      currentPath: location.pathname,
      forceExit,
      loadingDuration
    });
  }, [
    isAuthPage, 
    authLoading, 
    memoryLoading, 
    user, 
    memoryError, 
    dataFetchAttempted, 
    location.pathname, 
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
          // Force exit from loading state after 10 seconds
          if (newDuration >= 10 && !forceExit) {
            console.warn('CRITICAL: Forcing exit from loading state after 10s');
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
    console.log('Retrying after error or timeout...');
    if (memoryError && retryLoadMemories) {
      retryLoadMemories();
    } else {
      // Force reload as fallback
      window.location.reload();
    }
  };

  // Show loading screen only when necessary
  const showLoading = !isAuthPage && !forceExit && (authLoading || (memoryLoading && user));

  // Show error only on protected pages when data fetch was attempted
  const showError = !isAuthPage && (memoryError || authError) && (dataFetchAttempted || forceExit);

  // Loading message based on what's actually happening
  const loadingMessage = authLoading 
    ? "Checking authentication..." 
    : memoryLoading 
      ? "Loading your memories..." 
      : "Initializing app...";

  const errorMessage = memoryError || authError || "There was a problem loading the app.";

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
          <main className="pb-20">
            {children}
          </main>
          {!isAuthPage && <Navbar />}
        </motion.div>
      ) : null}
    </div>
  );
};

export default Layout;