import React from 'react';
import { motion } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiGift, FiHeart, FiStar, FiCalendar, FiZap, FiTrendingUp, FiAlertCircle } = FiIcons;

const Statistics = () => {
  const { memories, streaks, getDisplayName } = useMemory();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'birthday': return FiGift;
      case 'anniversary': return FiHeart;
      case 'special': return FiStar;
      case 'holiday': return FiCalendar;
      default: return FiCalendar;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'birthday': return 'from-pastel-pink to-vibrant-pink';
      case 'anniversary': return 'from-pastel-teal to-vibrant-teal';
      case 'special': return 'from-pastel-yellow to-vibrant-yellow';
      case 'holiday': return 'from-pastel-purple to-vibrant-purple';
      default: return 'from-gray-300 to-gray-500';
    }
  };

  const getTypeStats = () => {
    const types = ['birthday', 'anniversary', 'special', 'holiday'];
    return types.map(type => {
      const typeMemories = memories.filter(m => m.type === type);
      const totalQuestions = typeMemories.reduce(
        (sum, memory) => sum + memory.correctCount + memory.incorrectCount,
        0
      );
      const totalCorrect = typeMemories.reduce(
        (sum, memory) => sum + memory.correctCount,
        0
      );
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      return {
        type,
        count: typeMemories.length,
        accuracy,
        totalQuestions,
        icon: getTypeIcon(type),
        color: getTypeColor(type)
      };
    }).filter(stat => stat.count > 0);
  };

  // Get worst performing memories for "Needs Practice" section
  const getNeedsPracticeMemories = () => {
    return memories
      .filter(memory => memory.correctCount + memory.incorrectCount > 0) // Only memories that have been practiced
      .map(memory => {
        const totalQuestions = memory.correctCount + memory.incorrectCount;
        const accuracy = Math.round((memory.correctCount / totalQuestions) * 100);
        return {
          ...memory,
          accuracy,
          totalQuestions,
          displayName: getDisplayName(memory)
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy) // Sort by lowest accuracy first
      .slice(0, 3); // Take the 3 worst performing
  };

  const typeStats = getTypeStats();
  const needsPracticeMemories = getNeedsPracticeMemories();
  const totalMemories = memories.length;
  const totalCorrect = memories.reduce((sum, memory) => sum + memory.correctCount, 0);
  const totalIncorrect = memories.reduce((sum, memory) => sum + memory.incorrectCount, 0);
  const totalQuestions = totalCorrect + totalIncorrect;
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  if (memories.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-r from-pastel-pink to-pastel-teal rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiZap} className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">No Memories Yet</h2>
          <p className="text-text-secondary px-4">
            Add some memories first to see your statistics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Statistics</h1>
        <p className="text-text-secondary">Track your memory progress</p>
      </div>

      {/* Overall Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">Overall Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-vibrant-pink">{totalMemories}</p>
            <p className="text-text-secondary">Memories</p>
          </div>
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-vibrant-teal">{overallAccuracy}%</p>
            <p className="text-text-secondary">Accuracy</p>
          </div>
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{totalCorrect}</p>
            <p className="text-text-secondary">Correct</p>
          </div>
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{totalIncorrect}</p>
            <p className="text-text-secondary">Incorrect</p>
          </div>
        </div>
      </motion.div>

      {/* Streak Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">Streaks</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-pastel-pink to-vibrant-pink rounded-xl p-4 text-center text-white">
            <p className="text-3xl font-bold">{streaks.questionOfDay?.current || 0}</p>
            <p className="text-sm opacity-90">Question of the Day Streak</p>
            <p className="text-xs opacity-75">Best: {streaks.questionOfDay?.best || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-pastel-teal to-vibrant-teal rounded-xl p-4 text-center text-white">
            <p className="text-3xl font-bold">{streaks.flashcard.current}</p>
            <p className="text-sm opacity-90">Flashcard Streak</p>
            <p className="text-xs opacity-75">Best: {streaks.flashcard.best}</p>
          </div>
        </div>
      </motion.div>

      {/* Type Breakdown */}
      {typeStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4">Memory Types</h2>
          <div className="space-y-4">
            {typeStats.map((stat, index) => (
              <motion.div
                key={stat.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${getTypeColor(stat.type)}`}>
                    <SafeIcon icon={getTypeIcon(stat.type)} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary capitalize">{stat.type}</p>
                    <p className="text-sm text-text-secondary">{stat.count} memories</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-text-primary">{stat.accuracy}%</p>
                  <p className="text-sm text-text-secondary">{stat.totalQuestions} questions</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Needs Practice Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-2 mb-4">
          <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold text-text-primary">Needs Practice</h2>
        </div>
        <div className="space-y-3">
          {needsPracticeMemories.length > 0 ? (
            needsPracticeMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${getTypeColor(memory.type)}`}>
                    <SafeIcon icon={getTypeIcon(memory.type)} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{memory.displayName}</p>
                    <p className="text-sm text-text-secondary capitalize">{memory.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{memory.accuracy}%</p>
                  <p className="text-sm text-text-secondary">{memory.totalQuestions} attempts</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiZap} className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-text-secondary">
                {memories.length > 0
                  ? "No practice sessions completed yet. Start practicing to see areas for improvement!"
                  : "Add some memories and practice with flashcards to see which ones need more attention."}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Improvement Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex items-center space-x-2 mb-4">
          <SafeIcon icon={FiTrendingUp} className="w-5 h-5 text-vibrant-pink" />
          <h2 className="text-xl font-bold text-text-primary">Tips for Better Memory</h2>
        </div>
        <ul className="space-y-3 text-text-secondary">
          <li className="flex items-start space-x-2">
            <span className="text-vibrant-pink font-bold">•</span>
            <span>Complete the Question of the Day to improve your memory retention and build streaks</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-vibrant-pink font-bold">•</span>
            <span>Focus on memories in the "Needs Practice" section above</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-vibrant-pink font-bold">•</span>
            <span>Add more diverse memory types for better organization and recall</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-vibrant-pink font-bold">•</span>
            <span>Review upcoming dates regularly to stay prepared for special occasions</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default Statistics;