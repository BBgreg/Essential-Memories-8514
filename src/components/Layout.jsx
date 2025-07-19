import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import ConfettiBackground from './ConfettiBackground';
import { useLocation } from 'react-router-dom';

console.log("DEBUG: Layout.jsx - Component loading");

const Layout = ({ children }) => {
  console.log("DEBUG: Layout.jsx - Layout component rendering");
  
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

  console.log("DEBUG: Layout.jsx - Current path:", location.pathname, "isAuthPage:", isAuthPage);

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

console.log("DEBUG: Layout.jsx - Component loaded successfully");
export default Layout;