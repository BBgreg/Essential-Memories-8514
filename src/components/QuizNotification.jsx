import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';
import { useMemory } from '../contexts/MemoryContext'; // Import should now work correctly

const { FiX, FiCheck, FiCalendar, FiHelpCircle } = FiIcons;

// ... rest of the component implementation remains the same ...