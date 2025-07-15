import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { refreshSession } from '../lib/supabase';

const { FiLoader, FiAlertCircle, FiRefreshCw } = FiIcons;

const LoadingScreen = ({ 
  message = 'Loading your memories...', 
  error = null, 
  onRetry = null, 
  showRetry = false 
}) => {
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  // Enhanced component lifecycle logging
  useEffect(() => {
    console.log('[LoadingScreen] Mounted with:', {
      hasError: !!error,
      message,
      showRetry,
      currentTime: new Date().toISOString()
    });

    return () => {
      console.log('[LoadingScreen] Unmounted at:', new Date().toISOString());
    };
  }, [error, message, showRetry]);

  // Show retry button after delay if still loading
  useEffect(() => {
    if (!error) {
      const timer = setTimeout(() => {
        console.log('[LoadingScreen] Showing retry button after delay');
        setShowRetryButton(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Track loading time and attempt auto-recovery
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        console.log('[LoadingScreen] Loading time:', newTime, 'seconds');
        
        // At 4 seconds, try auto-refreshing the session if we haven't already
        if (newTime === 4 && !refreshAttempted && !error) {
          console.log('[LoadingScreen] Auto-attempting session refresh after 4s delay');
          setRefreshAttempted(true);
          refreshSession().then(success => {
            console.log('[LoadingScreen] Auto session refresh result:', success ? 'Success' : 'Failed');
          });
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error, refreshAttempted]);

  // Provide detailed error message for long loading times
  const getDetailedHelp = () => {
    if (loadingTime > 8) {
      return (
        <div className="mt-4 text-xs text-text-secondary bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Troubleshooting tips:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Check your internet connection</li>
            <li>Try clearing your browser cache</li>
            <li>Try using a different browser</li>
            <li>If problem persists, try signing out and back in</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  // Handle retry button click
  const handleRetry = () => {
    console.log('[LoadingScreen] Retry requested after', loadingTime, 'seconds');
    
    // Call the provided retry function
    if (onRetry) onRetry();
    
    // For very long loading times, force page reload
    if (loadingTime > 12) {
      console.log('[LoadingScreen] Long loading time detected, forcing page reload');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      {error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm px-6"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiAlertCircle} className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Unable to Load</h2>
          <p className="text-text-secondary">
            {error || "There was a problem loading your data. Please check your connection and try again."}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 px-6 rounded-xl font-semibold shadow-lg mt-4 mx-auto flex items-center"
          >
            <SafeIcon icon={FiRefreshCw} className="w-5 h-5 mr-2" />
            Try Again
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto"
          >
            <SafeIcon icon={FiLoader} className="w-12 h-12 text-vibrant-pink" />
          </motion.div>
          <p className="text-lg font-medium text-text-primary">
            {message}
            <span className="text-xs text-gray-400">({loadingTime}s)</span>
          </p>
          {getDetailedHelp()}
          {(showRetryButton || showRetry) && onRetry && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="bg-gray-100 text-text-primary py-2 px-4 rounded-lg font-medium text-sm mx-auto flex items-center mt-4"
            >
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
              Retry Loading
            </motion.button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LoadingScreen;