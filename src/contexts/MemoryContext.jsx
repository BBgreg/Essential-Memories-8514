import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { differenceInDays } from 'date-fns';

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

        // Fetch memories from the new dates_esm1234567 table
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('dates_esm1234567')
          .select('*')
          .eq('user_id', user.id);

        if (memoriesError) {
          console.error('Error fetching memories:', memoriesError);
          setError('Failed to load memories');
          return;
        }

        // Process memories and add display properties
        const processedMemories = memoriesData.map(memory => {
          const month = memory.date_month;
          const day = memory.date_day;
          const formattedDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
          
          return {
            ...memory,
            id: memory.id,
            name: memory.event_name,
            type: memory.event_type.toLowerCase(),
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
            .eq('date_id', memory.id)
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

  // Add a new memory using the new schema
  const addMemory = async (memoryData) => {
    if (!user) throw new Error('You must be logged in to add a memory');

    try {
      const [month, day] = memoryData.date.split('/').map(Number);
      
      const newMemory = {
        user_id: user.id,
        event_name: memoryData.name,
        date_month: month,
        date_day: day,
        event_type: memoryData.type.charAt(0).toUpperCase() + memoryData.type.slice(1),
        notes: memoryData.notes || null
      };

      const { data, error } = await supabase
        .from('dates_esm1234567')
        .insert(newMemory)
        .select()
        .single();

      if (error) throw error;

      const formattedMemory = {
        ...data,
        name: data.event_name,
        type: data.event_type.toLowerCase(),
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

  // Submit flashcard answer and record practice session
  const submitFlashcardAnswer = async (dateId, isCorrect) => {
    if (!user) throw new Error('You must be logged in to submit answers');

    try {
      // Record the practice session
      const { error: sessionError } = await supabase
        .from('practice_sessions_esm1234567')
        .insert({
          user_id: user.id,
          date_id: dateId,
          is_correct: isCorrect,
          session_type: 'Flashcard'
        });

      if (sessionError) throw sessionError;

      // Update streak data using RPC function
      const { error: streakError } = await supabase.rpc('update_streak_data', {
        p_user_id: user.id,
        p_is_correct: isCorrect,
        p_session_type: 'Flashcard'
      });

      if (streakError) throw streakError;

      // Refresh streak data
      const { data: streakData } = await supabase
        .from('streak_data_esm1234567')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
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

      return { success: true };
    } catch (error) {
      console.error('Error submitting flashcard answer:', error);
      throw error;
    }
  };

  // Get memories for quiz (prioritize those that need practice)
  const getMemoriesForQuiz = () => {
    if (memories.length === 0) return [];
    
    return [...memories].sort((a, b) => {
      const aTotal = a.correctCount + a.incorrectCount;
      const bTotal = b.correctCount + b.incorrectCount;
      
      // Prioritize memories that haven't been practiced
      if (aTotal === 0 && bTotal === 0) return a.daysUntil - b.daysUntil;
      if (aTotal === 0) return -1;
      if (bTotal === 0) return 1;
      
      // Then sort by accuracy (lowest first)
      const aAccuracy = a.correctCount / aTotal;
      const bAccuracy = b.correctCount / bTotal;
      
      return aAccuracy - bAccuracy;
    });
  };

  // Update streak using RPC function
  const updateStreak = async (isCorrect, type = 'flashcard') => {
    if (!user) throw new Error('You must be logged in to update streaks');

    try {
      const sessionType = type === 'flashcard' ? 'Flashcard' : 'Question of the Day';
      
      const { error } = await supabase.rpc('update_streak_data', {
        p_user_id: user.id,
        p_is_correct: isCorrect,
        p_session_type: sessionType
      });

      if (error) throw error;

      // Refresh streak data
      const { data: streakData } = await supabase
        .from('streak_data_esm1234567')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
        const newStreaks = {
          flashcard: {
            current: streakData.flashcard_current_streak || 0,
            best: streakData.flashcard_all_time_high || 0
          },
          questionOfDay: {
            current: streakData.qotd_current_streak || 0,
            best: streakData.qotd_all_time_high || 0
          }
        };
        
        setStreaks(newStreaks);
        return newStreaks[type === 'flashcard' ? 'flashcard' : 'questionOfDay'];
      }

      return { current: 0, best: 0 };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  };

  // Get "Needs Practice" memories
  const getNeedsPracticeMemories = async (limit = 5) => {
    if (!user) return [];

    try {
      // Fetch practice sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('practice_sessions_esm1234567')
        .select('date_id, is_correct')
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Calculate recall percentage for each date
      const dateStats = {};
      sessions.forEach(session => {
        if (!dateStats[session.date_id]) {
          dateStats[session.date_id] = { correct: 0, total: 0 };
        }
        dateStats[session.date_id].total++;
        if (session.is_correct) {
          dateStats[session.date_id].correct++;
        }
      });

      const datesWithRecall = Object.keys(dateStats).map(dateId => {
        const stats = dateStats[dateId];
        const recallPercentage = (stats.correct / stats.total) * 100;
        return { date_id: dateId, recall_percentage: recallPercentage };
      });

      // Sort by recall percentage ascending
      datesWithRecall.sort((a, b) => a.recall_percentage - b.recall_percentage);

      const worstPerformingDateIds = datesWithRecall.slice(0, limit).map(d => d.date_id);

      if (worstPerformingDateIds.length === 0) {
        return [];
      }

      const { data: dates, error: datesError } = await supabase
        .from('dates_esm1234567')
        .select('*')
        .in('id', worstPerformingDateIds)
        .eq('user_id', user.id);

      if (datesError) throw datesError;

      return dates.map(date => {
        const stats = datesWithRecall.find(d => d.date_id === date.id);
        return {
          ...date,
          name: date.event_name,
          type: date.event_type.toLowerCase(),
          recall_percentage: stats ? stats.recall_percentage : null
        };
      });
    } catch (error) {
      console.error('Error getting needs practice memories:', error);
      return [];
    }
  };

  // Helper function for displaying memory names
  const getDisplayName = (memory) => {
    return memory.type === 'birthday' 
      ? `${memory.name}'s Birthday` 
      : memory.name;
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
    submitFlashcardAnswer,
    getDisplayName,
    getUpcomingDates,
    getMemoriesForQuiz,
    getNeedsPracticeMemories,
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