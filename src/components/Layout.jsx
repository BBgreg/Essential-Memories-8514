import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMemory } from '../contexts/MemoryContext';
import Navbar from './Navbar';
import ConfettiBackground from './ConfettiBackground';
import LoadingScreen from './LoadingScreen';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { loading: authLoading, user } = useAuth();
  const { 
    loading: memoryLoading, 
    error: memoryError,
    dataFetchAttempted,
    retryLoadMemories 
  } = useMemory();
  
  const location = useLocation();
  
  // Don't show loading screen on auth pages
  const isAuthPage = [
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/update-password', 
    '/terms', 
    '/privacy'
  ].includes(location.pathname);

  // Debug logging
  console.log('Layout render state:', {
    isAuthPage,
    authLoading,
    memoryLoading,
    hasUser: !!user,
    memoryError,
    dataFetchAttempted,
    currentPath: location.pathname
  });
  
  // Show loading screen only when necessary
  const showLoading = !isAuthPage && (authLoading || (memoryLoading && user));
  
  // Show error only on protected pages when data fetch was attempted
  const showError = !isAuthPage && memoryError && dataFetchAttempted;

  return (
    <div className="app-container min-h-screen relative">
      <ConfettiBackground />
      
      {showLoading && (
        <LoadingScreen 
          message={authLoading ? "Checking authentication..." : "Loading your memories..."}
        />
      )}
      
      {showError && (
        <LoadingScreen 
          error={memoryError}
          onRetry={retryLoadMemories}
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