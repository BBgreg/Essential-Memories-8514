import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } = FiIcons;

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, authError, clearAuthError, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  console.log('[Signup] Component state:', {
    email,
    signupSuccess,
    isSubmitting,
    authError,
    formError
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('[Signup] User already logged in, redirecting to home');
      navigate('/home');
    }
  }, [user, navigate]);

  // Clear auth errors on unmount
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

    if (!termsAccepted) {
      setFormError('You must accept the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Signup] Form submitted');

    if (!validateForm()) {
      console.log('[Signup] Form validation failed:', formError);
      return;
    }

    setIsSubmitting(true);
    console.log('[Signup] Attempting signup for email:', email);

    try {
      const result = await signUp(email, password, { display_name: displayName });
      console.log('[Signup] Signup result:', result);

      if (result) {
        console.log('[Signup] Signup successful, showing success message');
        setSignupSuccess(true);
      }
    } catch (error) {
      console.error('[Signup] Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - email verification message
  if (signupSuccess) {
    console.log('[Signup] Rendering success state');
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-4">Check Your Email</h2>
          
          <div className="space-y-4 text-text-secondary">
            <p>
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
            <p>
              Please check your email inbox (including spam/junk folder) and click the confirmation link to verify your account.
            </p>
            <p className="text-sm">
              Once verified, you can log in and start using Essential Memories!
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
              >
                Go to Login
              </motion.button>
            </Link>
            
            <p className="text-sm text-text-secondary">
              Didn't receive the email?{' '}
              <button
                onClick={() => {
                  setSignupSuccess(false);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-vibrant-pink font-medium hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main signup form
  console.log('[Signup] Rendering signup form');
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
            <p className="text-text-secondary">Create your account to get started</p>
          </div>

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
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-text-primary font-semibold block">Display Name (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you want to be called"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-vibrant-pink focus:outline-none bg-white/60"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
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
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <p className="text-xs text-text-secondary ml-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-text-primary font-semibold block">Confirm Password</label>
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
                  <SafeIcon icon={showConfirmPassword ? FiEyeOff : FiEye} className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-vibrant-pink border-gray-300 rounded focus:ring-vibrant-pink"
                required
              />
              <label htmlFor="terms" className="text-sm text-text-secondary">
                I agree to the{' '}
                <Link to="/terms" className="text-vibrant-pink hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-vibrant-pink hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-vibrant-pink font-medium hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;