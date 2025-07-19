import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import QuestionOfTheDay from '../components/QuestionOfTheDay';

const { FiPlus, FiZap, FiTrendingUp, FiCalendar, FiGift } = FiIcons;

const Home = () => {
  const { memories, streaks, getUpcomingDates, getDisplayName } = useMemory();
  const upcomingDates = getUpcomingDates().slice(0, 3); // Show only 3 dates
  
  console.log("DEBUG: Home - Rendering with streaks:", streaks);
  console.log("DEBUG: Upcoming Dates - Gradient color updated. (Change 4)");

  const getTypeIcon = (type) => {
    switch (type) {
      case 'birthday':
        return FiIcons.FiGift;
      case 'anniversary':
        return FiIcons.FiHeart;
      case 'special':
        return FiIcons.FiStar;
      case 'holiday':
        return FiIcons.FiCalendar;
      default:
        return FiIcons.FiCalendar;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'birthday':
        return 'from-pastel-pink to-vibrant-pink';
      case 'anniversary':
        return 'from-pastel-teal to-vibrant-teal';
      case 'special':
        return 'from-pastel-yellow to-vibrant-yellow';
      case 'holiday':
        return 'from-pastel-purple to-vibrant-purple';
      default:
        return 'from-gray-300 to-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold gradient-text"
        >
          Essential Memories
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-text-secondary"
        >
          Never miss what truly matters
        </motion.p>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Box 1 (Top Left): Question of the Day Streak */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-vibrant-pink to-vibrant-purple rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <SafeIcon icon={FiZap} className="w-6 h-6" />
            <span className="text-2xl font-bold">{streaks.questionOfDay?.current || 0}</span>
          </div>
          <h3 className="font-semibold text-sm opacity-90">Question of the Day Streak</h3>
          <p className="text-xs opacity-75">Best: {streaks.questionOfDay?.best || 0}</p>
        </motion.div>

        {/* Box 2 (Top Right): Question of the Day Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuestionOfTheDay />
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Box 3 (Bottom Left): Add Memory */}
        <Link to="/add">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold shadow-lg flex items-center justify-center space-x-2"
          >
            <SafeIcon icon={FiPlus} className="w-5 h-5" />
            <span>Add Memory</span>
          </motion.button>
        </Link>

        {/* Box 4 (Bottom Right): Practice */}
        <Link to="/flashcards">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-vibrant-yellow to-vibrant-purple text-white py-4 rounded-2xl font-semibold shadow-lg flex items-center justify-center space-x-2"
          >
            <SafeIcon icon={FiZap} className="w-5 h-5" />
            <span>Practice</span>
          </motion.button>
        </Link>
      </div>

      {/* Upcoming Dates Section - with vibrant gradient background */}
      {upcomingDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-400/60 to-pink-400/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <div className="flex items-center space-x-2 mb-4">
            <SafeIcon icon={FiCalendar} className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Upcoming Dates</h2>
          </div>
          <div className="space-y-3">
            {upcomingDates.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${getTypeColor(
                  memory.type
                )} shadow-sm`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <SafeIcon icon={getTypeIcon(memory.type)} className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">{getDisplayName(memory)}</p>
                    <p className="text-white/80 text-sm">
                      {memory.date} • {memory.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                    <p className="text-white font-bold text-sm">
                      {memory.daysUntil === 0
                        ? 'Today!'
                        : memory.daysUntil === 1
                        ? 'Tomorrow'
                        : `${memory.daysUntil} days`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {memories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 space-y-4"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-pastel-pink to-pastel-teal rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiIcons.FiGift} className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">Start Building Memories</h3>
          <p className="text-text-secondary px-4">
            Add your first birthday, anniversary, or special date to begin your memory journey!
          </p>
          <Link to="/add">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white px-8 py-3 rounded-2xl font-semibold shadow-lg"
            >
              Get Started
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default Home;