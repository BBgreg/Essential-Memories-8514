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
    questionOfDay: { current: 0, best: 0, lastAnswered: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load memories when authenticated
  useEffect(() => {
    const loadMemories = async () => {
      console.log('DEBUG: Loading memories for user:', user?.id);
      
      if (!user) {
        console.log('DEBUG: No user found, clearing memories');
        setMemories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('DEBUG: Fetching memories from dates_esm1234567');
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('dates_esm1234567')
          .select('*')
          .eq('user_id', user.id);

        if (memoriesError) {
          console.error('DEBUG: Error fetching memories:', memoriesError);
          setError('Failed to load memories');
          return;
        }

        console.log('DEBUG: Successfully fetched memories:', memoriesData?.length || 0);

        // Process memories and add display properties
        const processedMemories = memoriesData.map(memory => ({
          id: memory.id,
          userId: memory.user_id,
          name: memory.name,
          displayName: memory.display_name,
          type: memory.category.toLowerCase(),
          date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`,
          month: memory.month,
          day: memory.day,
          category: memory.category,
          createdAt: memory.created_at,
          correctCount: 0,
          incorrectCount: 0
        }));

        setMemories(processedMemories);
        
        // Load practice data
        if (processedMemories.length > 0) {
          const { data: practiceData, error: practiceError } = await supabase
            .from('practice_sessions_esm1234567')
            .select('date_id, is_correct')
            .eq('user_id', user.id);
            
          if (!practiceError && practiceData) {
            const memoriesWithPractice = processedMemories.map(memory => {
              const memoryPractices = practiceData.filter(p => p.date_id === memory.id);
              const correctCount = memoryPractices.filter(p => p.is_correct).length;
              const incorrectCount = memoryPractices.filter(p => !p.is_correct).length;
              return {
                ...memory,
                correctCount,
                incorrectCount
              };
            });
            setMemories(memoriesWithPractice);
          }
        }
        
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
              best: streakData.qotd_all_time_high || 0,
              lastAnswered: streakData.last_qod_date
            }
          });
        }
      } catch (error) {
        console.error('DEBUG: Unexpected error loading memories:', error);
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
    console.log('DEBUG: Adding new memory:', memoryData);
    
    if (!user) {
      console.error('DEBUG: Add Memory - User not logged in');
      throw new Error('You must be logged in to add a memory');
    }

    try {
      const [month, day] = memoryData.date.split('/').map(Number);
      
      // Prepare the memory data for insertion
      const newMemory = {
        user_id: user.id,
        name: memoryData.name.trim(),
        display_name: memoryData.type === 'birthday' 
          ? `${memoryData.name.trim()}'s Birthday`
          : memoryData.name.trim(),
        month,
        day,
        category: memoryData.type.charAt(0).toUpperCase() + memoryData.type.slice(1)
      };

      console.log('DEBUG: Inserting memory into dates_esm1234567:', newMemory);

      const { data, error } = await supabase
        .from('dates_esm1234567')
        .insert([newMemory])
        .select()
        .single();

      if (error) {
        console.error('DEBUG: Supabase INSERT error:', error);
        throw new Error(`Failed to save memory: ${error.message}`);
      }

      console.log('DEBUG: Memory inserted successfully:', data);

      // Format the memory for the UI
      const formattedMemory = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        displayName: data.display_name,
        type: data.category.toLowerCase(),
        date: `${String(data.month).padStart(2, '0')}/${String(data.day).padStart(2, '0')}`,
        month: data.month,
        day: data.day,
        category: data.category,
        createdAt: data.created_at,
        correctCount: 0,
        incorrectCount: 0,
        daysUntil: calculateDaysUntil(data.month, data.day)
      };

      setMemories(prev => [...prev, formattedMemory]);
      return formattedMemory;
    } catch (error) {
      console.error('DEBUG: Error in addMemory:', error);
      throw error;
    }
  };

  // Submit flashcard answer and record practice session
  const submitFlashcardAnswer = async (dateId, isCorrect) => {
    if (!user) throw new Error('You must be logged in to submit answers');

    try {
      console.log('DEBUG: Submitting flashcard answer:', { dateId, isCorrect });
      
      // Record the practice session
      const { error: sessionError } = await supabase
        .from('practice_sessions_esm1234567')
        .insert({
          user_id: user.id,
          date_id: dateId,
          is_correct: isCorrect,
          session_type: 'Flashcard'
        });

      if (sessionError) {
        console.error('DEBUG: Error recording practice session:', sessionError);
        throw sessionError;
      }

      // Update streak data using RPC function
      const { error: streakError } = await supabase.rpc('update_streak_data', {
        p_user_id: user.id,
        p_is_correct: isCorrect,
        p_session_type: 'Flashcard'
      });

      if (streakError) {
        console.error('DEBUG: Error updating streak data:', streakError);
        throw streakError;
      }

      // Update memory stats locally
      setMemories(prev => 
        prev.map(memory => {
          if (memory.id === dateId) {
            return {
              ...memory,
              correctCount: memory.correctCount + (isCorrect ? 1 : 0),
              incorrectCount: memory.incorrectCount + (isCorrect ? 0 : 1)
            };
          }
          return memory;
        })
      );

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
            best: streakData.qotd_all_time_high || 0,
            lastAnswered: streakData.last_qod_date
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('DEBUG: Error submitting flashcard answer:', error);
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
      console.log('DEBUG: Updating streak:', { isCorrect, type });
      
      const sessionType = type === 'flashcard' ? 'Flashcard' : 'Question of the Day';
      
      const { error } = await supabase.rpc('update_streak_data', {
        p_user_id: user.id,
        p_is_correct: isCorrect,
        p_session_type: sessionType
      });

      if (error) {
        console.error('DEBUG: Error updating streak:', error);
        throw error;
      }

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
            best: streakData.qotd_all_time_high || 0,
            lastAnswered: type === 'questionOfDay' ? new Date().toISOString().split('T')[0] : streakData.last_qod_date
          }
        };
        
        setStreaks(newStreaks);
        return newStreaks[type === 'flashcard' ? 'flashcard' : 'questionOfDay'];
      }

      return { current: 0, best: 0 };
    } catch (error) {
      console.error('DEBUG: Error updating streak:', error);
      throw error;
    }
  };

  // Get "Needs Practice" memories
  const getNeedsPracticeMemories = async (limit = 5) => {
    if (!user) return [];

    try {
      console.log('DEBUG: Getting needs practice memories');
      
      // Fetch practice sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('practice_sessions_esm1234567')
        .select('date_id, is_correct')
        .eq('user_id', user.id);

      if (sessionsError) {
        console.error('DEBUG: Error fetching practice sessions:', sessionsError);
        throw sessionsError;
      }

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
        const recallPercentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 100;
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

      if (datesError) {
        console.error('DEBUG: Error fetching dates for needs practice:', datesError);
        throw datesError;
      }

      return dates.map(date => {
        const stats = datesWithRecall.find(d => d.date_id === date.id);
        return {
          ...date,
          name: date.name,
          type: date.category.toLowerCase(),
          recall_percentage: stats ? stats.recall_percentage : null
        };
      });
    } catch (error) {
      console.error('DEBUG: Error getting needs practice memories:', error);
      return [];
    }
  };

  // Helper function for displaying memory names
  const getDisplayName = (memory) => {
    return memory.displayName || (memory.type === 'birthday' 
      ? `${memory.name}'s Birthday` 
      : memory.name);
  };

  // Get upcoming dates
  const getUpcomingDates = () => {
    const memoriesWithDaysUntil = memories.map(memory => {
      const month = memory.month;
      const day = memory.day;
      return {
        ...memory,
        daysUntil: calculateDaysUntil(month, day)
      };
    });
    
    return [...memoriesWithDaysUntil].sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Check if today's question has been answered
  const hasAnsweredTodaysQuestion = () => {
    const today = new Date().toISOString().split('T')[0];
    return streaks.questionOfDay?.lastAnswered === today;
  };

  // Mark today's question as answered
  const markTodaysQuestionAsAnswered = async (isCorrect) => {
    try {
      console.log('DEBUG: Marking today\'s question as answered:', { isCorrect });
      
      const result = await updateStreak(isCorrect, 'questionOfDay');
      return result;
    } catch (error) {
      console.error('DEBUG: Error marking question as answered:', error);
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