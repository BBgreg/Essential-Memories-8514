import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';
import MMDDInput from './MMDDInput';
import { useMemory } from '../contexts/MemoryContext';

const { FiX, FiCheck, FiCalendar, FiHelpCircle, FiAlertCircle } = FiIcons;

const QuizNotification = ({ memory, onAnswer, onClose, isQuestionOfTheDay = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFlip = () => {
    if (!answered) {
      setIsFlipped(!isFlipped);
    }
  };

  const validateInput = () => {
    if (!userInput || userInput.length < 4) {
      setInputError('Please enter a complete date (MM/DD)');
      return false;
    }
    
    // Ensure format is MM/DD
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
    if (!regex.test(userInput)) {
      setInputError('Please enter a valid date in MM/DD format');
      return false;
    }
    
    return true;
  };

  const handleSubmitAnswer = () => {
    if (!validateInput()) return;
    
    // Compare user input with correct answer
    const correctAnswer = memory.date;
    console.log("DEBUG: QOTD - Validating MM/DD input. User:", userInput, "Correct:", correctAnswer);
    
    const isUserCorrect = userInput === correctAnswer;
    setIsCorrect(isUserCorrect);
    setAnswered(true);
    
    // Call the parent component's onAnswer function
    if (onAnswer) {
      onAnswer(memory.id, isUserCorrect);
    }
    
    // Show the correct answer if user was wrong
    if (!isUserCorrect) {
      setShowAnswer(true);
    }
  };

  const handleUserInputChange = (value) => {
    setUserInput(value);
    setInputError('');
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
                ? isCorrect
                  ? "Correct! Well done!"
                  : "Not quite right, keep practicing!"
                : "Test your memory with this quick question"}
            </p>
          </div>

          {!answered ? (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">When is</h3>
                <p className="text-2xl font-bold mb-2 text-vibrant-pink">{memory.name}</p>
                <p className="text-lg capitalize text-text-secondary">{memory.type}?</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-center text-text-secondary">Enter the date (MM/DD)</p>
                
                <MMDDInput
                  value={userInput}
                  onChange={handleUserInputChange}
                  onSubmit={handleSubmitAnswer}
                />
                
                {inputError && (
                  <p className="text-xs text-red-500 text-center">{inputError}</p>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitAnswer}
                  className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 rounded-xl font-semibold text-lg shadow-lg"
                >
                  Submit Answer
                </motion.button>
              </div>
            </>
          ) : (
            <>
              {!isCorrect && showAnswer && (
                <div className="mb-6 bg-red-50 p-4 rounded-xl text-center">
                  <p className="text-sm text-text-secondary mb-1">The correct answer was</p>
                  <p className="text-xl font-bold text-vibrant-pink">{memory.date}</p>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-3 rounded-xl font-semibold text-lg shadow-lg mt-4"
              >
                Continue
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizNotification;