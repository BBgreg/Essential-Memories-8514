import React, { createContext, useContext, useState } from 'react';

// Create a mock memory context with no backend
const MemoryContext = createContext({});

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

export const MemoryProvider = ({ children }) => {
  // Mock state with no actual data persistence
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(true);
  const [streaks, setStreaks] = useState({
    questionOfDay: { current: 0, best: 0 },
    flashcard: { current: 0, best: 0 }
  });

  // Mock memory functions with no backend
  const addMemory = async (memoryData) => {
    try {
      console.log('Mock addMemory called with:', memoryData);
      
      // Create a mock memory object with a random ID
      const newMemory = {
        id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...memoryData,
        date: memoryData.date,
        correctCount: 0,
        incorrectCount: 0,
        created_at: new Date().toISOString()
      };
      
      // Update local state (but it won't persist)
      setMemories(prev => [newMemory, ...prev]);
      
      return newMemory;
    } catch (error) {
      console.error('Mock error in addMemory:', error);
      setError('Failed to add memory (mock error)');
      throw error;
    }
  };

  // Mock function to get display name
  const getDisplayName = (memory) => {
    return memory.type === 'birthday' ? `${memory.name}'s Birthday` : memory.name;
  };

  // Mock function to get upcoming dates
  const getUpcomingDates = () => {
    return memories.map(memory => {
      // Mock implementation
      return { 
        ...memory, 
        nextDate: new Date(),
        daysUntil: Math.floor(Math.random() * 30) // Random days until
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Mock function to get memories for quiz
  const getMemoriesForQuiz = () => {
    return memories.slice(0, 5);
  };

  // Mock function for flashcard answers
  const submitFlashcardAnswer = (memoryId, correct) => {
    console.log('Mock submitFlashcardAnswer called:', { memoryId, correct });
    
    // Update local state
    setMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        return {
          ...m,
          correctCount: correct ? m.correctCount + 1 : m.correctCount,
          incorrectCount: correct ? m.incorrectCount : m.incorrectCount + 1
        };
      }
      return m;
    }));
  };

  // Mock function for today's question
  const hasAnsweredTodaysQuestion = () => {
    return false;
  };

  // Mock function for marking today's question
  const markTodaysQuestionAsAnswered = (correct, memoryId) => {
    console.log('Mock markTodaysQuestionAsAnswered called:', { correct, memoryId });
  };

  // Mock retry function
  const retryLoadMemories = () => {
    console.log('Mock retryLoadMemories called');
  };

  const value = {
    memories,
    loading,
    error,
    dataFetchAttempted,
    streaks,
    addMemory,
    retryLoadMemories,
    getDisplayName,
    getUpcomingDates,
    getMemoriesForQuiz,
    submitFlashcardAnswer,
    hasAnsweredTodaysQuestion,
    markTodaysQuestionAsAnswered
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export default MemoryProvider;