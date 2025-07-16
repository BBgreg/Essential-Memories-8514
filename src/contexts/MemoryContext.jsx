import React, { createContext, useContext, useState } from 'react';

const MemoryContext = createContext({});

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

export const MemoryProvider = ({ children }) => {
  const [memories, setMemories] = useState([]);
  const [streaks, setStreaks] = useState({ current: 0, best: 0 });

  const addMemory = async (memory) => {
    const newMemory = {
      id: Date.now().toString(),
      ...memory,
      correctCount: 0,
      incorrectCount: 0
    };
    setMemories(prev => [...prev, newMemory]);
    return newMemory;
  };

  const updateStreak = async (isCorrect) => {
    const newCurrentStreak = isCorrect ? streaks.current + 1 : 0;
    const newBestStreak = Math.max(streaks.best, newCurrentStreak);
    
    setStreaks({
      current: newCurrentStreak,
      best: newBestStreak
    });
    
    return { current: newCurrentStreak, best: newBestStreak };
  };

  const value = {
    memories,
    streaks,
    addMemory,
    updateStreak,
    getDisplayName: (memory) => {
      return memory.type === 'birthday' ? `${memory.name}'s Birthday` : memory.name;
    },
    getUpcomingDates: () => memories
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export default MemoryProvider;