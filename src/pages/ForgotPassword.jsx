import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMail, FiAlertCircle, FiArrowLeft, FiCheckCircle } = FiIcons;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword, authError, clearAuthError, user, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Clear any auth errors when the component unmounts
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const validateForm = () => {
    setFormError('');
    
    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(email);
      
      if (result) {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return null; // Will show the LoadingScreen from Layout
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
        >
          <div className="flex items-center mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/login')}
              className="p-2 mr-4 rounded-full bg-white/60 backdrop-blur-sm shadow-lg"
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-text-primary" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
              <p className="text-text-secondary">We'll send you a password reset link</p>
            </div>
          </div>

          {resetSent ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-6"
            >
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-text-primary">Check Your Email</h2>
                <p className="text-text-secondary">
                  We've sent a password reset link to <span className="font-medium">{email}</span>
                </p>
              </div>
              <p className="text-sm text-text-secondary">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={handleSubmit} 
                  className="text-vibrant-pink font-medium hover:underline"
                >
                  try again
                </button>
              </p>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
                >
                  Back to Login
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <>
              {(authError || formError) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 flex items-center"
                >
                  <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{formError || authError}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-text-primary font-semibold block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <SafeIcon icon={FiMail} className="w-5 h-5 text-text-secondary" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-vibrant-pink focus:outline-none bg-white/60"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-text-secondary">
                  Remembered your password?{' '}
                  <Link to="/login" className="text-vibrant-pink font-medium hover:underline">
                    Back to Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;