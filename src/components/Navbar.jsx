import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';

const { FiHome, FiPlus, FiCalendar, FiLayers, FiBarChart3, FiUser } = FiIcons;

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Don't show navbar on auth pages
  const authPaths = ['/login', '/signup', '/forgot-password', '/update-password'];
  if (authPaths.includes(location.pathname)) {
    return null;
  }
  
  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/calendar', icon: FiCalendar, label: 'Calendar' },
    { path: '/add', icon: FiPlus, label: 'Add' },
    { path: '/flashcards', icon: FiLayers, label: 'Practice' },
    { path: user ? '/profile' : '/login', icon: user ? FiUser : FiBarChart3, label: user ? 'Profile' : 'Stats' }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-white/20"
    >
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isCenter = item.path === '/add';
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center p-2 min-w-0 relative"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white shadow-lg'
                    : isCenter
                    ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white shadow-lg'
                    : 'text-text-secondary hover:text-vibrant-pink'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5" />
              </motion.div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isActive || isCenter ? 'text-vibrant-pink' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -top-1 w-1 h-1 bg-vibrant-pink rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default Navbar;