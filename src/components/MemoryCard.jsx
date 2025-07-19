import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useMemory } from '../contexts/MemoryContext';

const { FiCalendar, FiHeart, FiGift, FiStar, FiEdit2, FiTrash2 } = FiIcons;

const MemoryCard = ({ memory, onEdit, onDelete, showActions = true }) => {
  const { getDisplayName } = useMemory();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'birthday': return FiGift;
      case 'anniversary': return FiHeart;
      case 'special': return FiStar;
      default: return FiCalendar;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'birthday': return 'from-pastel-pink to-vibrant-pink';
      case 'anniversary': return 'from-pastel-teal to-vibrant-teal';
      case 'special': return 'from-pastel-yellow to-vibrant-yellow';
      default: return 'from-pastel-purple to-vibrant-purple';
    }
  };

  const formatDate = (dateString) => {
    try {
      const [month, day] = dateString.split('/');
      const date = new Date();
      date.setMonth(parseInt(month) - 1);
      date.setDate(parseInt(day));
      return format(date, 'MMM d');
    } catch (error) {
      return dateString;
    }
  };

  const getAccuracy = () => {
    const total = memory.correctCount + memory.incorrectCount;
    if (total === 0) return 0;
    return Math.round((memory.correctCount / total) * 100);
  };

  const displayName = getDisplayName(memory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full bg-gradient-to-r ${getTypeColor(memory.type)}`}>
            <SafeIcon icon={getTypeIcon(memory.type)} className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-lg">{displayName}</h3>
            <p className="text-text-secondary text-sm">{formatDate(memory.date)}</p>
          </div>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(memory)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SafeIcon icon={FiEdit2} className="w-4 h-4 text-text-secondary" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(memory.id)}
              className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="w-4 h-4 text-red-600" />
            </motion.button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex space-x-4">
          <span className="text-green-600 font-medium">✓ {memory.correctCount}</span>
          <span className="text-red-600 font-medium">✗ {memory.incorrectCount}</span>
        </div>
        <div className="text-text-secondary">{getAccuracy()}% accuracy</div>
      </div>

      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-vibrant-teal to-vibrant-pink rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${getAccuracy()}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

export default MemoryCard;