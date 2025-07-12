import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ConfettiBackground from './ConfettiBackground';
import { useMemory } from '../contexts/MemoryContext';

const { FiX, FiCheck, FiCalendar, FiHelpCircle } = FiIcons;

const QuizNotification = ({ memory, onAnswer, onClose, isQuestionOfTheDay = false }) => {
  const { getDisplayName, markTodaysQuestionAsAnswered } = useMemory();
  const [monthDigits, setMonthDigits] = useState('');
  const [dayDigits, setDayDigits] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Get the proper display name (with "'s Birthday" for birthdays)
  const displayName = getDisplayName(memory);

  // Format displayed date (MM/DD format)
  const getFormattedCorrectDate = () => {
    if (!memory || !memory.date) return '';
    return memory.date; // Already in MM/DD format
  };

  // Handle input change for the formatted MM/DD input
  const handleInputChange = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove any non-numeric characters
    
    if (input.length <= 2) {
      // Setting month digits
      setMonthDigits(input);
      setDayDigits('');
    } else {
      // Month is set, now setting day digits
      const month = input.substring(0, 2);
      const day = input.substring(2, 4);
      
      setMonthDigits(month);
      setDayDigits(day);
    }
  };

  // Format the input for display in the field
  const getFormattedInput = () => {
    if (!monthDigits) return '';
    
    if (dayDigits) {
      return `${monthDigits}/${dayDigits}`;
    }
    
    return `${monthDigits}`;
  };

  // Handle keyboard navigation for better UX
  const handleKeyDown = (e) => {
    if (e.key === '/') {
      // If user presses slash, focus on day section
      if (monthDigits.length === 1) {
        setMonthDigits(monthDigits.padStart(2, '0'));
      }
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      if (dayDigits) {
        setDayDigits('');
        e.preventDefault();
      } else if (monthDigits) {
        setMonthDigits(monthDigits.slice(0, -1));
        e.preventDefault();
      }
    }
  };

  // Complete validation check for MM/DD format
  const isValidDate = () => {
    if (monthDigits.length !== 2 || dayDigits.length !== 2) return false;
    
    const month = parseInt(monthDigits, 10);
    const day = parseInt(dayDigits, 10);
    
    if (month < 1 || month > 12) return false;
    
    // Check days per month (accounting for leap year February)
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day > 0 && day <= daysInMonth[month];
  };

  const handleSubmit = () => {
    const userAnswer = `${monthDigits}/${dayDigits}`;
    
    // Get the correct answer in MM/DD format
    const correctAnswer = memory.date;
    
    // Exact match comparison
    const correct = userAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setShowAnswer(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    // If this is the question of the day, mark it as answered
    if (isQuestionOfTheDay) {
      markTodaysQuestionAsAnswered(correct, memory.id);
    }
    
    onAnswer(memory.id, correct);
  };

  const handleClose = () => {
    setShowAnswer(false);
    setMonthDigits('');
    setDayDigits('');
    setInputFocused(false);
    onClose();
  };

  // Format the memory date for display in the answer feedback
  const formatDateForDisplay = () => {
    try {
      // Parse MM/DD format
      const [month, day] = memory.date.split('/');
      
      // Create a date using current year
      const date = new Date();
      date.setMonth(parseInt(month) - 1);
      date.setDate(parseInt(day));
      
      // Format as "Month Day" (e.g., January 15)
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[parseInt(month) - 1]} ${parseInt(day)} (${month}/${day})`;
    } catch (error) {
      return memory.date;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <ConfettiBackground burst={showConfetti} />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5 text-text-secondary" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-vibrant-pink to-vibrant-teal rounded-full flex items-center justify-center mx-auto mb-4">
              <SafeIcon 
                icon={isQuestionOfTheDay ? FiHelpCircle : FiCalendar} 
                className="w-8 h-8 text-white" 
              />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {isQuestionOfTheDay ? "Question of the Day" : "Quick Quiz!"}
            </h2>
            <p className="text-text-secondary">
              When is <span className="font-semibold text-vibrant-pink">{displayName}</span>?
            </p>
          </div>

          {!showAnswer ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="text-xs text-text-secondary mb-1 ml-1">
                  Enter date as MM/DD
                </div>
                <div className={`relative border ${inputFocused ? 'border-vibrant-pink' : 'border-gray-200'} rounded-xl overflow-hidden`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={getFormattedInput()}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="MM/DD"
                    className="w-full p-4 text-center text-lg font-medium bg-transparent focus:outline-none"
                    autoFocus
                  />
                  {!getFormattedInput() && (
                    <div className="absolute inset-0 flex items-center justify-center text-lg text-gray-300 pointer-events-none">
                      MM/DD
                    </div>
                  )}
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!isValidDate()}
                className="w-full bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Submit Answer
              </motion.button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                <SafeIcon
                  icon={isCorrect ? FiCheck : FiX}
                  className={`w-8 h-8 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </h3>
                <p className="text-text-secondary">
                  {displayName} is on{' '}
                  <span className="font-semibold text-vibrant-pink">
                    {formatDateForDisplay()}
                  </span>
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-text-primary py-4 rounded-xl font-semibold text-lg"
              >
                Continue
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizNotification;