import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiUser, FiMail, FiLock, FiLogOut } = FiIcons;

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  const handleSignOut = async () => {
    console.log('Sign out requested');
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
            {user?.user_metadata?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <p className="text-lg font-semibold text-text-primary">
            {user?.user_metadata?.display_name || 'User'}
          </p>
          <p className="text-text-secondary text-sm">{user?.email || 'user@example.com'}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-sm text-text-secondary mb-1">Display Name</p>
              <div className="flex items-center">
                <SafeIcon icon={FiUser} className="w-5 h-5 text-text-secondary mr-3" />
                <p className="text-text-primary font-medium">
                  {user?.user_metadata?.display_name || 'User'}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-sm text-text-secondary mb-1">Email Address</p>
              <div className="flex items-center">
                <SafeIcon icon={FiMail} className="w-5 h-5 text-text-secondary mr-3" />
                <p className="text-text-primary font-medium">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {}}
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
      </motion.div>
    </div>
  );
};

export default Profile;