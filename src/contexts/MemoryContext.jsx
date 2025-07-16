import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { format, addDays, differenceInDays } from 'date-fns';

// Create the context
const MemoryContext = createContext({});

// Create the hook for using the context
export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

// Create the provider component
export const MemoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [streaks, setStreaks] = useState({
    flashcard: { current: 0, best: 0 },
    questionOfDay: { current: 0, best: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load memories when authenticated
  useEffect(() => {
    const loadMemories = async () => {
      if (!user) {
        setMemories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch memories from Supabase
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('memories_esm1234567')
          .select('*')
          .eq('user_id', user.id);

        if (memoriesError) {
          console.error('Error fetching memories:', memoriesError);
          setError('Failed to load memories');
          return;
        }

        // Process memories and add display properties
        const processedMemories = memoriesData.map(memory => {
          const memoryDate = new Date(memory.memory_date);
          const month = memoryDate.getMonth() + 1;
          const day = memoryDate.getDate();
          const formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
          
          return {
            ...memory,
            date: formattedDate,
            daysUntil: calculateDaysUntil(month, day),
            correctCount: 0,
            incorrectCount: 0
          };
        });

        // Fetch practice statistics for each memory
        for (const memory of processedMemories) {
          const { data: practiceData, error: practiceError } = await supabase
            .from('practice_sessions_esm1234567')
            .select('is_correct')
            .eq('memory_id', memory.id)
            .eq('user_id', user.id);

          if (!practiceError && practiceData) {
            memory.correctCount = practiceData.filter(session => session.is_correct).length;
            memory.incorrectCount = practiceData.filter(session => !session.is_correct).length;
          }
        }

        setMemories(processedMemories);

        // Load streak data
        const { data: streakData, error: streakError } = await supabase
          .from('streak_data_esm1234567')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!streakError && streakData) {
          setStreaks({
            flashcard: {
              current: streakData.flashcard_current_streak || 0,
              best: streakData.flashcard_all_time_high || 0
            },
            questionOfDay: {
              current: streakData.qotd_current_streak || 0,
              best: streakData.qotd_all_time_high || 0
            }
          });
        }

      } catch (error) {
        console.error('Error loading memories:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [user]);

  // Helper function to calculate days until a date
  const calculateDaysUntil = (month, day) => {
    const today = new Date();
    const memoryDate = new Date(today.getFullYear(), month - 1, day);
    
    if (memoryDate < today) {
      memoryDate.setFullYear(today.getFullYear() + 1);
    }
    
    return differenceInDays(memoryDate, today);
  };

  // Add a new memory
  const addMemory = async (memoryData) => {
    if (!user) throw new Error('You must be logged in to add a memory');

    try {
      const [month, day] = memoryData.date.split('/').map(Number);
      const currentYear = new Date().getFullYear();
      
      const newMemory = {
        user_id: user.id,
        title: memoryData.name,
        description: memoryData.notes || null,
        memory_type: memoryData.type,
        memory_date: `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };

      const { data, error } = await supabase
        .from('memories_esm1234567')
        .insert(newMemory)
        .select()
        .single();

      if (error) throw error;

      const formattedMemory = {
        ...data,
        date: memoryData.date,
        daysUntil: calculateDaysUntil(month, day),
        correctCount: 0,
        incorrectCount: 0
      };

      setMemories(prev => [...prev, formattedMemory]);
      return formattedMemory;
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  };

  // Get memories for quiz
  const getMemoriesForQuiz = () => {
    if (memories.length === 0) return [];
    
    return [...memories].sort((a, b) => {
      const aTotal = a.correctCount + a.incorrectCount;
      const bTotal = b.correctCount + b.incorrectCount;
      
      if (aTotal === 0 && bTotal === 0) return a.daysUntil - b.daysUntil;
      if (aTotal === 0) return -1;
      if (bTotal === 0) return 1;
      
      const aAccuracy = a.correctCount / aTotal;
      const bAccuracy = b.correctCount / bTotal;
      
      return aAccuracy - bAccuracy;
    });
  };

  // Update streak
  const updateStreak = async (isCorrect, type = 'flashcard') => {
    if (!user) throw new Error('You must be logged in to update streaks');

    try {
      let { data: currentStreak } = await supabase
        .from('streak_data_esm1234567')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentStreak) {
        const { data } = await supabase
          .from('streak_data_esm1234567')
          .insert({ user_id: user.id })
          .select()
          .single();
        currentStreak = data;
      }

      const currentField = type === 'flashcard' ? 'flashcard_current_streak' : 'qotd_current_streak';
      const bestField = type === 'flashcard' ? 'flashcard_all_time_high' : 'qotd_all_time_high';
      const dateField = type === 'flashcard' ? 'last_flashcard_date' : 'last_qod_date';

      const newCurrentStreak = isCorrect ? (currentStreak[currentField] || 0) + 1 : 0;
      const newBestStreak = Math.max(newCurrentStreak, currentStreak[bestField] || 0);

      await supabase
        .from('streak_data_esm1234567')
        .update({
          [currentField]: newCurrentStreak,
          [bestField]: newBestStreak,
          [dateField]: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      setStreaks(prev => ({
        ...prev,
        [type === 'flashcard' ? 'flashcard' : 'questionOfDay']: {
          current: newCurrentStreak,
          best: newBestStreak
        }
      }));

      return { current: newCurrentStreak, best: newBestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  };

  // Helper function for displaying memory names
  const getDisplayName = (memory) => {
    return memory.memory_type === 'birthday' 
      ? `${memory.title}'s Birthday` 
      : memory.title;
  };

  // Get upcoming dates
  const getUpcomingDates = () => {
    return [...memories].sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Check if today's question has been answered
  const hasAnsweredTodaysQuestion = () => {
    const today = new Date().toISOString().split('T')[0];
    return streaks.questionOfDay?.lastAnswered === today;
  };

  // Mark today's question as answered
  const markTodaysQuestionAsAnswered = async (isCorrect) => {
    try {
      const result = await updateStreak(isCorrect, 'questionOfDay');
      return result;
    } catch (error) {
      console.error('Error marking question as answered:', error);
      throw error;
    }
  };

  const value = {
    memories,
    streaks,
    loading,
    error,
    addMemory,
    getDisplayName,
    getUpcomingDates,
    getMemoriesForQuiz,
    hasAnsweredTodaysQuestion,
    markTodaysQuestionAsAnswered,
    updateStreak
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export default MemoryProvider;