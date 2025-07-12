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
  
  const handleQuizStart = () => {
    const quizMemories = getMemoriesForQuiz();
    if (quizMemories.length > 0) {
      // Use SRS algorithm to select the most appropriate memory to quiz
      const memoryToQuiz = quizMemories[0]; // First one is highest priority based on SRS
      setCurrentQuizMemory(memoryToQuiz);
      setShowQuiz(true);
    }
  };

  const handleQuizAnswer = (memoryId, correct) => {
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
        className={`bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 
          ${!isCompleted && hasMemories ? 'cursor-pointer pulse-glow' : 'opacity-80'}`}
        onClick={() => !isCompleted && hasMemories && handleQuizStart()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${isCompleted 
              ? 'bg-gradient-to-r from-pastel-green to-vibrant-green' 
              : 'bg-gradient-to-r from-vibrant-pink to-vibrant-teal'}`}
            >
              <SafeIcon 
                icon={isCompleted ? FiCheck : FiHelpCircle} 
                className="w-5 h-5 text-white" 
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Question of the Day</h2>
              <p className="text-text-secondary">
                {isCompleted 
                  ? "You've completed today's question!" 
                  : hasMemories 
                    ? "Tap to answer today's question" 
                    : "Add memories to enable daily questions"}
              </p>
            </div>
          </div>
          
          {isCompleted && (
            <div className="bg-pastel-green/20 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-green-600">Completed</span>
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