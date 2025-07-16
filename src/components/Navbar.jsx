import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiHome, FiPlus, FiCalendar, FiLayers, FiBarChart3, FiUser } = FiIcons;

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: FiHome, label: 'Home' },
    { path: '/add', icon: FiPlus, label: 'Add' },
    { path: '/calendar', icon: FiCalendar, label: 'Calendar' },
    { path: '/flashcards', icon: FiLayers, label: 'Practice' },
    { path: '/statistics', icon: FiBarChart3, label: 'Stats' },
    { path: '/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-t border-gray-200"
    >
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                console.log(`DEBUG: Navbar - Clicked on ${item.label} (${item.path})`);
              }}
              className="flex flex-col items-center justify-center space-y-1"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5" />
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-vibrant-pink' : 'text-text-secondary'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default Navbar;