import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiLoader, FiAlertCircle, FiRefreshCw } = FiIcons;

const LoadingScreen = ({ 
  message = 'Loading your memories...', 
  error = null, 
  onRetry = null,
  showRetry = false
}) => {
  const [showRetryButton, setShowRetryButton] = useState(false);
  
  // Show retry button after 10 seconds if still loading
  useEffect(() => {
    if (!error) {
      const timer = setTimeout(() => setShowRetryButton(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
          {(showRetry || showRetryButton) && onRetry && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 px-6 rounded-xl font-semibold shadow-lg mt-4 mx-auto flex items-center"
            >
              <SafeIcon icon={FiRefreshCw} className="w-5 h-5 mr-2" />
              Try Again
            </motion.button>
          )}
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
          <p className="text-lg font-medium text-text-primary">{message}</p>
          {showRetryButton && onRetry && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
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