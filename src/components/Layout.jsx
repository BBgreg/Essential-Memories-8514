import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import ConfettiBackground from './ConfettiBackground';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  // Don't show navbar on auth pages
  const isAuthPage = [
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/terms',
    '/privacy',
    '/' // Added root path as an auth page
  ].includes(location.pathname);

  return (
    <div className="app-container min-h-screen relative">
      <ConfettiBackground />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <main className="pb-20">{children}</main>
        {!isAuthPage && <Navbar />}
      </motion.div>
    </div>
  );
};

export default Layout;