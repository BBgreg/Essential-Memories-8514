import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import { format, parseISO } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';

const { FiRotateCcw, FiCheck, FiX, FiZap, FiTrendingUp } = FiIcons;

const Flashcards = () => {
  const { memories, submitFlashcardAnswer, getMemoriesForQuiz, streaks } = useMemory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizMemories, setQuizMemories] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    const memoriesToQuiz = getMemoriesForQuiz();
    if (memoriesToQuiz.length === 0) {
      setQuizMemories(memories.slice(0, 5));
    } else {
      setQuizMemories(memoriesToQuiz.slice(0, 5));
    }
  }, [memories, getMemoriesForQuiz]);

  const getCurrentMemory = () => {
    return quizMemories[currentIndex] || null;
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (correct) => {
    const currentMemory = getCurrentMemory();
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
    const memoriesToQuiz = getMemoriesForQuiz();
    setQuizMemories(memoriesToQuiz.length > 0 ? memoriesToQuiz.slice(0, 5) : memories.slice(0, 5));
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

  const currentMemory = getCurrentMemory();

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
          {/* Session complete content... */}
        </motion.div>
      </div>
    );
  }

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

      {/* Flashcard */}
      {currentMemory && (
        <div className="flex justify-center perspective-1000">
          <div className="w-full max-w-sm h-64">
            <motion.div
              className={`relative w-full h-full transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of card */}
              <motion.div
                className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-3xl shadow-2xl flex items-center justify-center p-6 cursor-pointer"
                onClick={handleFlip}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center text-white">
                  <h3 className="text-xl font-bold mb-2">When is</h3>
                  <p className="text-2xl font-bold mb-4">{currentMemory.name}</p>
                  <p className="text-lg capitalize">{currentMemory.type}?</p>
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
                  <h3 className="text-xl font-bold mb-2">{currentMemory.name}</h3>
                  <p className="text-3xl font-bold mb-4">
                    {format(parseISO(currentMemory.date), 'MMMM d')}
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
    </div>
  );
};

export default Flashcards;