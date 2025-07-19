import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiUser, FiMail, FiLogOut } = FiIcons;

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('DEBUG: Sign out initiated. (Change 1)');
    try {
      const result = await signOut();
      console.log('DEBUG: Sign out result (Change 1):', result);
      
      // Always redirect to login page after sign out, regardless of result
      console.log('DEBUG: Redirecting to login page after sign out. (Change 1)');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('DEBUG: Sign out error (Change 1):', error);
      // Still redirect to login on error for security
      navigate('/login', { replace: true });
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