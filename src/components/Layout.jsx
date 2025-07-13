import React, { useEffect } from 'react';
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
      console.log('No authenticated user found, redirecting to login page');
      navigate('/login');
    }
  }, [authLoading, user, location.pathname, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('Layout render state:', {
      isAuthPage,
      authLoading,
      memoryLoading,
      hasUser: !!user,
      memoryError,
      dataFetchAttempted,
      currentPath: location.pathname
    });
  }, [isAuthPage, authLoading, memoryLoading, user, memoryError, dataFetchAttempted, location.pathname]);

  // Retry function for auth errors
  const handleRetry = () => {
    console.log('Retrying after error...');
    if (memoryError && retryLoadMemories) {
      retryLoadMemories();
    } else {
      // Force reload as fallback
      window.location.reload();
    }
  };

  // Show loading screen only when necessary
  const showLoading = !isAuthPage && (authLoading || (memoryLoading && user));

  // Show error only on protected pages when data fetch was attempted
  const showError = !isAuthPage && (memoryError || authError) && dataFetchAttempted;

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
          showRetry={true}
        />
      )}
      
      {showError && (
        <LoadingScreen 
          error={errorMessage} 
          onRetry={handleRetry}
          showRetry={true}
        />
      )}
      
      {!showLoading && !showError && (
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
      )}
    </div>
  );
};

export default Layout;