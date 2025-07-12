import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiUser, FiMail, FiLock, FiLogOut, FiAlertCircle, FiCheckCircle } = FiIcons;

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, authError, clearAuthError, loading } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Set initial display name from profile when it loads
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Clear any auth errors when the component unmounts
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile({ display_name: displayName.trim() });
      
      if (result) {
        setUpdateSuccess(true);
        setIsEditing(false);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setFormError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return null; // Will show the LoadingScreen from Layout or redirect
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm shadow-lg"
        >
          <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-text-primary" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Your Profile</h1>
          <p className="text-text-secondary">Manage your account</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg"
      >
        {/* Profile picture placeholder */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
            {profile?.display_name ? profile.display_name[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {profile?.display_name || user.email.split('@')[0]}
          </p>
          <p className="text-text-secondary text-sm">{user.email}</p>
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

        {updateSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 text-green-600 rounded-xl p-4 mb-6 flex items-center"
          >
            <SafeIcon icon={FiCheckCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">Profile updated successfully!</p>
          </motion.div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-text-primary font-semibold block">Display Name</label>
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsEditing(false);
                  if (profile?.display_name) {
                    setDisplayName(profile.display_name);
                  }
                }}
                className="bg-gray-100 text-text-primary py-3 rounded-2xl font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-text-secondary mb-1">Display Name</p>
                <div className="flex items-center">
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-text-secondary mr-3" />
                  <p className="text-text-primary font-medium">
                    {profile?.display_name || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm text-text-secondary mb-1">Email Address</p>
                <div className="flex items-center">
                  <SafeIcon icon={FiMail} className="w-5 h-5 text-text-secondary mr-3" />
                  <p className="text-text-primary font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold shadow-lg"
              >
                Edit Profile
              </motion.button>
              
              <Link to="/update-password">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white border border-gray-200 text-text-primary py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiLock} className="w-5 h-5" />
                  <span>Change Password</span>
                </motion.button>
              </Link>
              
              <Link to="/terms" className="text-vibrant-pink text-center font-medium hover:underline py-2">
                Terms of Service
              </Link>
              
              <Link to="/privacy" className="text-vibrant-pink text-center font-medium hover:underline py-2">
                Privacy Policy
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="bg-red-50 text-red-600 py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 mt-4"
              >
                <SafeIcon icon={FiLogOut} className="w-5 h-5" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;