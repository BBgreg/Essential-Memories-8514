import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import { format, parseISO } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';

const { FiRotateCcw, FiCheck, FiX, FiZap, FiTrendingUp } = FiIcons;

const Flashcards = () => {
  const { memories, updateStreak, streaks } = useMemory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizMemories, setQuizMemories] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    // Shuffle memories for quiz
    const shuffled = [...memories].sort(() => Math.random() - 0.5);
    setQuizMemories(shuffled.slice(0, 5)); // Take 5 random memories
  }, [memories]);

  const getCurrentMemory = () => {
    return quizMemories[currentIndex] || null;
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (correct) => {
    const currentMemory = getCurrentMemory();
    if (currentMemory) {
      // Update streak in database and state
      await updateStreak(correct);

      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1
      }));

      if (correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      // Wait for animation to complete before moving to next card
      setTimeout(() => {
        if (currentIndex < quizMemories.length - 1) {
          setIsFlipped(false);
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 300); // Wait for flip back animation
        } else {
          setSessionComplete(true);
        }
      }, 1000);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, total: 0 });
    setSessionComplete(false);
    const shuffled = [...memories].sort(() => Math.random() - 0.5);
    setQuizMemories(shuffled.slice(0, 5));
  };

  // ... rest of your component remains the same ...

  return (
    <div className="p-6 space-y-6">
      <ConfettiBackground burst={showConfetti} />
      
      {/* Header with Streak Counter */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Flashcard Practice</h1>
        <div className="flex justify-center items-center space-x-4">
          <p className="text-text-secondary">
            Card {currentIndex + 1} of {quizMemories.length}
          </p>
          <div className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal px-4 py-1 rounded-full">
            <p className="text-white font-semibold">
              Streak: {streaks.current}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIndex + 1) / quizMemories.length) * 100}%`
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Flashcard */}
      {getCurrentMemory() && (
        <div className="flex justify-center perspective-1000">
          <div className="w-full max-w-sm h-64">
            <motion.div
              className={`relative w-full h-full transition-transform duration-500 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
              onClick={handleFlip}
            >
              {/* Front of card */}
              <motion.div
                className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-3xl shadow-2xl flex items-center justify-center p-6 cursor-pointer"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold mb-2">When is</h3>
                  <p className="text-2xl font-bold mb-4">
                    {getCurrentMemory().name}
                  </p>
                  <p className="text-lg capitalize">{getCurrentMemory().type}?</p>
                  <div className="mt-6 text-sm opacity-75">
                    Tap to reveal answer
                  </div>
                </div>
              </motion.div>

              {/* Back of card */}
              <motion.div
                className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-teal to-vibrant-yellow rounded-3xl shadow-2xl flex items-center justify-center p-6"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold mb-2">
                    {getCurrentMemory().name}
                  </h3>
                  <p className="text-3xl font-bold mb-4">
                    {getCurrentMemory().date}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Answer buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(false)}
              className="bg-gradient-to-r from-red-400 to-red-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
              <span>Incorrect</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(true)}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiCheck} className="w-5 h-5" />
              <span>Correct</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Complete Screen */}
      {sessionComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center">
              <SafeIcon icon={FiTrendingUp} className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                Session Complete!
              </h2>
              <p className="text-4xl font-bold text-vibrant-pink mt-2">
                {Math.round((sessionStats.correct / sessionStats.total) * 100)}%
              </p>
              <p className="text-text-secondary mt-2">
                {sessionStats.correct} correct out of {sessionStats.total}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-lg font-semibold text-text-primary">
                Current Streak: {streaks.current}
              </p>
              <p className="text-sm text-text-secondary">
                Best Streak: {streaks.best}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetSession}
              className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-xl font-semibold"
            >
              Practice Again
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Flashcards;