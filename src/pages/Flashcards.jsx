import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemory } from '../contexts/MemoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from '../components/ConfettiBackground';

const { FiCheck, FiX, FiZap, FiTrendingUp, FiArrowRight, FiRefreshCw } = FiIcons;

const Flashcards = () => {
  const { memories, getMemoriesForQuiz } = useMemory();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizMemories, setQuizMemories] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    initializeSession();
  }, [memories]);

  const initializeSession = () => {
    console.log("DEBUG: Flashcard - Session started. 5 cards selected. (Change 3.4)");
    const memoriesToQuiz = getMemoriesForQuiz();
    // Take 5 random memories or less if not enough available
    const selectedMemories = memoriesToQuiz.length >= 5 
      ? memoriesToQuiz.slice(0, 5) 
      : memoriesToQuiz.length > 0 
        ? memoriesToQuiz 
        : memories.slice(0, Math.min(5, memories.length));
    
    setQuizMemories(selectedMemories);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ correct: 0, total: 0 });
    setSessionComplete(false);
    setShowButtons(false);
  };

  const getCurrentMemory = () => {
    return quizMemories[currentIndex] || null;
  };

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      setShowButtons(true);
      console.log("DEBUG: Flashcard - Card flipped. Displaying answer. (Change 3.1)");
    }
  };

  const handleAnswer = async (correct) => {
    const currentMemory = getCurrentMemory();
    
    if (currentMemory) {
      try {
        console.log(`DEBUG: Flashcard - Answer recorded: ${correct ? 'Correct' : 'Incorrect'}`);
        
        // Update session stats
        setSessionStats(prev => ({
          correct: prev.correct + (correct ? 1 : 0),
          total: prev.total + 1
        }));
        
        if (correct) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
        
        // Move to next card after delay
        setTimeout(() => {
          setShowButtons(false);
          setIsFlipped(false);
          
          // Check if session is complete (5 cards answered)
          if (currentIndex >= Math.min(quizMemories.length - 1, 4)) {
            console.log("DEBUG: Flashcard - Session ended. Displaying summary. (Change 3.5)");
            setSessionComplete(true);
          } else {
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
              console.log("DEBUG: Flashcard - Loading next flashcard. (Change 3.3)");
            }, 300);
          }
        }, 1000);
      } catch (error) {
        console.error('Error processing flashcard answer:', error);
      }
    }
  };

  const resetSession = () => {
    initializeSession();
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
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center">
            <SafeIcon icon={FiTrendingUp} className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Session Complete!</h2>
            <p className="text-4xl font-bold text-vibrant-pink">{accuracy}%</p>
            <p className="text-text-secondary mt-2">
              {sessionStats.correct} correct out of {sessionStats.total} questions
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetSession}
              className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-2xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
            >
              <SafeIcon icon={FiRefreshCw} className="w-5 h-5" />
              <span>Practice Again</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '#/home'}
              className="bg-gradient-to-r from-gray-200 to-gray-300 text-text-primary py-4 rounded-2xl font-semibold text-lg shadow-lg"
            >
              Go Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ConfettiBackground burst={showConfetti} />
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Flashcard Practice</h1>
        <p className="text-text-secondary">
          Card {currentIndex + 1} of {Math.min(quizMemories.length, 5)}
        </p>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / Math.min(quizMemories.length, 5)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {currentMemory && (
        <div className="flex justify-center perspective-1000 py-4">
          <motion.div
            className="w-full max-w-sm h-64 cursor-pointer"
            onClick={!isFlipped ? handleFlip : undefined}
          >
            <motion.div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of card */}
              <motion.div
                className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-3xl shadow-2xl flex items-center justify-center p-6"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center text-white">
                  <p className="text-2xl font-bold mb-4">{currentMemory.title}</p>
                  <p className="text-lg capitalize">{currentMemory.memory_type}</p>
                  {!isFlipped && (
                    <div className="mt-6 text-sm opacity-75 flex items-center justify-center space-x-2">
                      <span>Tap to flip</span>
                      <SafeIcon icon={FiArrowRight} className="w-4 h-4" />
                    </div>
                  )}
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
                  <h3 className="text-xl font-bold mb-2">{currentMemory.title}</h3>
                  <p className="text-3xl font-bold mb-4">{currentMemory.date}</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
      
      <AnimatePresence>
        {showButtons && (
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
      
      {console.log("DEBUG: Flashcard - Correct/Incorrect buttons displayed. (Change 3.2)")}
    </div>
  );
};

export default Flashcards;