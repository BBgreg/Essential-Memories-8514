import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useMemory } from '../contexts/MemoryContext';
import QuizNotification from './QuizNotification';
import ConfettiBackground from './ConfettiBackground';

const { FiHelpCircle, FiCheck } = FiIcons;

const QuestionOfTheDay = () => {
  const { getMemoriesForQuiz, hasAnsweredTodaysQuestion, markTodaysQuestionAsAnswered } = useMemory();
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizMemory, setCurrentQuizMemory] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleted, setIsCompleted] = useState(hasAnsweredTodaysQuestion());

  console.log("DEBUG: QuestionOfTheDay - Component rendering with isCompleted:", isCompleted);

  const handleQuizStart = () => {
    console.log("DEBUG: QuestionOfTheDay - Starting quiz");
    const quizMemories = getMemoriesForQuiz();
    if (quizMemories.length > 0) {
      // Use SRS algorithm to select the most appropriate memory to quiz
      const memoryToQuiz = quizMemories[0]; // First one is highest priority based on SRS
      console.log("DEBUG: QuestionOfTheDay - Selected memory for quiz:", memoryToQuiz);
      setCurrentQuizMemory(memoryToQuiz);
      setShowQuiz(true);
    }
  };

  const handleQuizAnswer = (memoryId, correct) => {
    console.log(`DEBUG: QuestionOfTheDay - Quiz answered: ${correct ? 'Correct' : 'Incorrect'}`);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Mark today's question as answered and update streak
    markTodaysQuestionAsAnswered(correct);
    setIsCompleted(true);

    // Close quiz after delay
    setTimeout(() => {
      setShowQuiz(false);
    }, 2000);
  };

  // Check if today's question has been answered
  useEffect(() => {
    setIsCompleted(hasAnsweredTodaysQuestion());
  }, [hasAnsweredTodaysQuestion]);

  const hasMemories = getMemoriesForQuiz().length > 0;

  return (
    <>
      <ConfettiBackground burst={showConfetti} />
      <motion.div
        whileHover={!isCompleted ? { scale: 1.02 } : { scale: 1 }}
        whileTap={!isCompleted ? { scale: 0.98 } : { scale: 1 }}
        className={`bg-gradient-to-r from-vibrant-yellow to-vibrant-purple rounded-2xl p-5 shadow-lg h-full flex items-center ${
          !isCompleted && hasMemories ? 'cursor-pointer' : isCompleted ? 'opacity-80' : ''
        }`}
        onClick={() => !isCompleted && hasMemories && handleQuizStart()}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isCompleted ? 'bg-white/20' : 'bg-white/20'
            }`}>
              <SafeIcon icon={isCompleted ? FiCheck : FiHelpCircle} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Question of the Day</h2>
              <p className="text-white/80">
                {isCompleted 
                  ? "You've completed today's question!" 
                  : hasMemories 
                  ? "Tap to answer today's question" 
                  : "Add memories to enable daily questions"}
              </p>
            </div>
          </div>
          {isCompleted && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-white">Completed</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quiz Modal */}
      {showQuiz && currentQuizMemory && (
        <QuizNotification
          memory={currentQuizMemory}
          onAnswer={handleQuizAnswer}
          onClose={() => setShowQuiz(false)}
          isQuestionOfTheDay={true}
        />
      )}
    </>
  );
};

export default QuestionOfTheDay;