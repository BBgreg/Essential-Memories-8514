import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';
import { useMemory } from '../contexts/MemoryContext';

const { FiX, FiCheck, FiCalendar, FiHelpCircle } = FiIcons;

const QuizNotification = ({ memory, onAnswer, onClose, isQuestionOfTheDay = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleFlip = () => {
    if (!answered) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleAnswer = (correct) => {
    setIsCorrect(correct);
    setAnswered(true);
    
    // Call the parent component's onAnswer function
    if (onAnswer) {
      onAnswer(memory.id, correct);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {!answered && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-text-secondary" />
          </motion.button>
        )}

        {/* Quiz content */}
        <div className="py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon 
                icon={answered ? (isCorrect ? FiCheck : FiX) : FiHelpCircle} 
                className="w-8 h-8 text-white" 
              />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">
              {isQuestionOfTheDay ? "Question of the Day" : "Quick Quiz"}
            </h2>
            <p className="text-text-secondary">
              {answered 
                ? (isCorrect ? "Correct! Well done!" : "Not quite right, keep practicing!")
                : "Test your memory with this quick question"
              }
            </p>
          </div>

          {/* Flashcard */}
          {!answered && (
            <div className="flex justify-center perspective-1000 mb-6">
              <div className="w-full h-48">
                <div
                  className={`relative w-full h-full transition-transform duration-500 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                  onClick={handleFlip}
                >
                  {/* Front of card */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-2xl shadow-lg flex items-center justify-center p-6 cursor-pointer"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center text-white">
                      <h3 className="text-xl font-bold mb-2">When is</h3>
                      <p className="text-2xl font-bold mb-2">{memory.name}</p>
                      <p className="text-lg capitalize">{memory.type}?</p>
                      <div className="mt-2 text-sm opacity-75">
                        Tap to reveal
                      </div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-vibrant-teal to-vibrant-yellow rounded-2xl shadow-lg flex items-center justify-center p-6"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="text-center text-white">
                      <p className="text-xl font-bold mb-2">{memory.name}</p>
                      <p className="text-3xl font-bold">{memory.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Answer buttons or completion message */}
          {!answered ? (
            isFlipped && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(false)}
                  className="bg-gradient-to-r from-red-400 to-red-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5" />
                  <span>Incorrect</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(true)}
                  className="bg-gradient-to-r from-green-400 to-green-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiCheck} className="w-5 h-5" />
                  <span>Correct</span>
                </motion.button>
              </div>
            )
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 rounded-xl font-semibold text-lg shadow-lg mt-4"
            >
              Continue
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizNotification;