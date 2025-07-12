import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import { format, parseISO } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from '../components/ConfettiBackground';

const { FiRotateCcw, FiCheck, FiX, FiZap, FiTrendingUp } = FiIcons;

const Flashcards = () => {
  const { memories, submitFlashcardAnswer, getMemoriesForQuiz, streaks, getDisplayName } = useMemory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizMemories, setQuizMemories] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentMemory, setCurrentMemory] = useState(null);

  useEffect(() => {
    const memoriesToQuiz = getMemoriesForQuiz();
    if (memoriesToQuiz.length === 0) {
      setQuizMemories(memories.slice(0, 5));
    } else {
      setQuizMemories(memoriesToQuiz.slice(0, 5));
    }
  }, [memories, getMemoriesForQuiz]);

  // Update current memory when index or memories change
  useEffect(() => {
    if (quizMemories.length > 0 && currentIndex < quizMemories.length) {
      setCurrentMemory(quizMemories[currentIndex]);
    }
  }, [currentIndex, quizMemories]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (correct) => {
    if (currentMemory) {
      submitFlashcardAnswer(currentMemory.id, correct);
      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1
      }));

      if (correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }

      // Move to next card or complete session
      if (currentIndex < quizMemories.length - 1) {
        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 300); // Wait for flip back animation
        }, 1000);
      } else {
        setTimeout(() => {
          setSessionComplete(true);
        }, 1000);
      }
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, total: 0 });
    setSessionComplete(false);
    const memoriesToQuiz = getMemoriesForQuiz();
    setQuizMemories(memoriesToQuiz.length > 0 ? memoriesToQuiz.slice(0, 5) : memories.slice(0, 5));
  };

  const formatDate = (dateString) => {
    try {
      // Parse MM/DD format
      const [month, day] = dateString.split('/');
      
      // Create a date using current year
      const date = new Date();
      date.setMonth(parseInt(month) - 1);
      date.setDate(parseInt(day));
      
      return format(date, 'MMMM d');
    } catch (error) {
      return dateString;
    }
  };

  if (memories.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-r from-pastel-pink to-pastel-teal rounded-full flex items-center justify-center mx-auto">
            <SafeIcon icon={FiZap} className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">No Memories Yet</h2>
          <p className="text-text-secondary px-4">
            Add some memories first to start practicing with flashcards!
          </p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <ConfettiBackground burst={accuracy >= 80} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-sm w-full"
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              accuracy >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
          >
            <SafeIcon icon={accuracy >= 80 ? FiCheck : FiTrendingUp} className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">Session Complete!</h2>
            <p className="text-text-secondary">
              You got {sessionStats.correct} out of {sessionStats.total} correct
            </p>
          </div>
          <div className="bg-gray-100 rounded-2xl p-4">
            <div className="text-4xl font-bold text-vibrant-pink mb-1">{accuracy}%</div>
            <div className="text-text-secondary">Accuracy</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-green-100 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-600">{streaks.flashcard.current}</div>
              <div className="text-xs text-green-600">Current Streak</div>
            </div>
            <div className="bg-purple-100 rounded-xl p-3">
              <div className="text-2xl font-bold text-purple-600">{streaks.flashcard.best}</div>
              <div className="text-xs text-purple-600">Best Streak</div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetSession}
            className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
          >
            Practice Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Get the proper display name for the current memory
  const displayName = currentMemory ? getDisplayName(currentMemory) : '';

  return (
    <div className="p-6 space-y-6">
      <ConfettiBackground burst={showConfetti} />
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Flashcard Practice</h1>
        <p className="text-text-secondary">
          Card {currentIndex + 1} of {quizMemories.length}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / quizMemories.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-white/20">
          <div className="text-2xl font-bold text-vibrant-pink">{sessionStats.correct}</div>
          <div className="text-sm text-text-secondary">Correct</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-white/20">
          <div className="text-2xl font-bold text-text-primary">{sessionStats.total}</div>
          <div className="text-sm text-text-secondary">Total</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-white/20">
          <div className="text-2xl font-bold text-vibrant-teal">
            {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
          </div>
          <div className="text-sm text-text-secondary">Accuracy</div>
        </div>
      </div>

      {/* Flashcard with 3D Flip Animation */}
      <div className="flex justify-center perspective-1000">
        <div className="w-full max-w-sm h-64">
          <motion.div
            className={`relative w-full h-full transition duration-500 card-container ${isFlipped ? 'flipped' : ''}`}
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front of card */}
            <motion.div
              className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-3xl shadow-2xl flex items-center justify-center p-6 cursor-pointer"
              onClick={handleFlip}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center text-white">
                <h3 className="text-xl font-bold mb-2">When is</h3>
                <p className="text-2xl font-bold mb-4">{displayName}</p>
                <p className="text-lg capitalize">{currentMemory?.type}?</p>
                <div className="mt-6 text-sm opacity-75">
                  Tap to reveal answer
                </div>
              </div>
            </motion.div>

            {/* Back of card */}
            <motion.div
              className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-teal to-vibrant-yellow rounded-3xl shadow-2xl flex items-center justify-center p-6"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-center text-white">
                <h3 className="text-xl font-bold mb-2">{displayName}</h3>
                <p className="text-3xl font-bold mb-4">
                  {currentMemory && formatDate(currentMemory.date)}
                </p>
                <p className="text-lg capitalize opacity-90">{currentMemory?.type}</p>
                <p className="text-sm opacity-75 mt-2">{currentMemory && currentMemory.date} (MM/DD)</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
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

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={resetSession}
        className="w-full bg-white/60 backdrop-blur-sm text-text-primary py-3 rounded-2xl font-semibold shadow-lg border border-white/20 flex items-center justify-center space-x-2"
      >
        <SafeIcon icon={FiRotateCcw} className="w-5 h-5" />
        <span>Reset Session</span>
      </motion.button>
    </div>
  );
};

export default Flashcards;