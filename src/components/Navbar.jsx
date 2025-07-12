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

  // Rest of your component code...
};

export default Navbar;