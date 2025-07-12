import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } = FiIcons;

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { updatePassword, authError, clearAuthError, user, loading } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  // Clear any auth errors when the component unmounts
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const validateForm = () => {
    setFormError('');
    
    if (!password) {
      setFormError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updatePassword(password);
      
      if (result) {
        setUpdateComplete(true);
      }
    } catch (error) {
      console.error('Update password error:', error);
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Update Password</h1>
            <p className="text-text-secondary">Create a new secure password</p>
          </div>

          {updateComplete ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-6"
            >
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-text-primary">Password Updated</h2>
                <p className="text-text-secondary">
                  Your password has been successfully updated
                </p>
              </div>
              <Link to={user ? '/' : '/login'}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
                >
                  {user ? 'Go to Home' : 'Log In'}
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
                  <label className="text-text-primary font-semibold block">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <SafeIcon icon={FiLock} className="w-5 h-5 text-text-secondary" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 focus:border-vibrant-pink focus:outline-none bg-white/60"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <SafeIcon 
                        icon={showPassword ? FiEyeOff : FiEye} 
                        className="w-5 h-5 text-text-secondary"
                      />
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary ml-1">Must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-text-primary font-semibold block">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <SafeIcon icon={FiLock} className="w-5 h-5 text-text-secondary" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 focus:border-vibrant-pink focus:outline-none bg-white/60"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <SafeIcon 
                        icon={showConfirmPassword ? FiEyeOff : FiEye} 
                        className="w-5 h-5 text-text-secondary"
                      />
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-text-secondary">
                  {user ? (
                    <Link to="/" className="text-vibrant-pink font-medium hover:underline">
                      Cancel and Go Back
                    </Link>
                  ) : (
                    <Link to="/login" className="text-vibrant-pink font-medium hover:underline">
                      Back to Login
                    </Link>
                  )}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UpdatePassword;