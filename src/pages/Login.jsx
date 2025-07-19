import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } = FiIcons;

const Login = () => {
  console.log("DEBUG: Login component - Starting render");
  
  const navigate = useNavigate();
  const { signIn, user, loading, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("DEBUG: Login component - State initialized", {
    user: user?.id || 'none',
    loading,
    authError: authError || 'none'
  });

  // Redirect if already logged in
  useEffect(() => {
    console.log("DEBUG: Login component - useEffect for user redirect", { user: user?.id, loading });
    if (user && !loading) {
      console.log("DEBUG: Login component - User logged in, redirecting to /home");
      navigate('/home');
    }
  }, [user, navigate, loading]);

  // Clear any auth errors when the component unmounts
  useEffect(() => {
    console.log("DEBUG: Login component - Setting up cleanup effect");
    return () => {
      console.log("DEBUG: Login component - Cleanup: clearing auth error");
      clearAuthError();
    };
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    console.log("DEBUG: Login component - Form submit started");
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("DEBUG: Login component - Attempting sign in with email:", email);
      const { user: loggedInUser, error } = await signIn(email, password);
      
      if (loggedInUser && !error) {
        console.log("DEBUG: Login component - Sign in successful, navigating to /home");
        navigate('/home');
      } else {
        console.log("DEBUG: Login component - Sign in failed:", error);
      }
    } catch (error) {
      console.error('DEBUG: Login component - Sign in error:', error);
    } finally {
      setIsSubmitting(false);
      console.log("DEBUG: Login component - Form submit completed");
    }
  };

  // Show loading state while auth is being checked
  if (loading) {
    console.log("DEBUG: Login component - Rendering loading state");
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  console.log("DEBUG: Login component - Rendering main login form");

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
            <h1 className="text-3xl font-bold gradient-text mb-2">Essential Memories</h1>
            <p className="text-text-secondary">Welcome back! Log in to your account</p>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 flex items-center"
            >
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{authError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-text-primary font-semibold block">Email</label>
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

            <div className="space-y-2">
              <label className="text-text-primary font-semibold block">Password</label>
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
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-vibrant-pink hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Signing In...' : 'Log In'}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-vibrant-pink font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

console.log("DEBUG: Login component - Module loaded successfully");
export default Login;