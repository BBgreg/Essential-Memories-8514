import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { differenceInDays, addYears } from 'date-fns';

// Create the Memory context
const MemoryContext = createContext({
  memories: [],
  loading: true,
  error: null,
  addMemory: () => {},
  updateMemory: () => {},
  deleteMemory: () => {},
  getDisplayName: () => {},
  getUpcomingDates: () => [],
  getMemoriesForQuiz: () => [],
  submitFlashcardAnswer: () => {},
  updateStreak: () => {},
  hasAnsweredTodaysQuestion: () => false,
  markTodaysQuestionAsAnswered: () => {},
  getNeedsPracticeMemories: () => [],
  streaks: {
    flashcard: { current: 0, best: 0 },
    questionOfDay: { current: 0, best: 0 }
  }
});

// Custom hook to use the Memory context
export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

// Memory Provider component
export const MemoryProvider = ({ children }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streaks, setStreaks] = useState({
    flashcard: { current: 0, best: 0 },
    questionOfDay: { current: 0, best: 0 }
  });
  const [user, setUser] = useState(null);

  // Get current user and subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DEBUG: MemoryContext - Auth state changed:', event);
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    // Initial auth check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    
    checkAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Calculate days until a date
  const calculateDaysUntil = useCallback((month, day) => {
    try {
      // Create date object for this year
      const today = new Date();
      const currentYear = today.getFullYear();
      const dateThisYear = new Date(currentYear, month - 1, day);
      
      // If the date has passed this year, use next year's date
      if (dateThisYear < today) {
        const dateNextYear = addYears(dateThisYear, 1);
        return differenceInDays(dateNextYear, today);
      }
      
      return differenceInDays(dateThisYear, today);
    } catch (error) {
      console.error('Error calculating days until:', error);
      return 0;
    }
  }, []);

  // Load memories when user changes
  useEffect(() => {
    const fetchMemories = async () => {
      if (!user) {
        setMemories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('DEBUG: MemoryContext - Fetching memories for user:', user.id);
        
        const { data, error } = await supabase
          .from('dates_esm1234567')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('DEBUG: MemoryContext - Error fetching memories:', error);
          throw error;
        }
        
        console.log('DEBUG: MemoryContext - Memories fetched:', data?.length || 0);
        
        // Format memories for the UI
        const formattedMemories = data.map(memory => ({
          id: memory.id,
          userId: memory.user_id,
          name: memory.name,
          displayName: memory.display_name,
          type: (memory.category || '').toLowerCase(),
          date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`,
          month: memory.month,
          day: memory.day,
          category: memory.category || 'Birthday',
          createdAt: memory.created_at,
          correctCount: memory.correct_count || 0,
          incorrectCount: memory.incorrect_count || 0,
          daysUntil: calculateDaysUntil(memory.month, memory.day)
        }));
        
        setMemories(formattedMemories);
      } catch (error) {
        console.error('DEBUG: MemoryContext - Error in fetchMemories:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [user, calculateDaysUntil]);

  // Fetch streaks data
  useEffect(() => {
    const fetchStreaks = async () => {
      if (!user) return;

      try {
        console.log('DEBUG: MemoryContext - Fetching streaks for user:', user.id);
        
        const { data, error } = await supabase
          .from('streak_data')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('DEBUG: MemoryContext - Error fetching streaks:', error);
          return;
        }
        
        if (data) {
          console.log('DEBUG: MemoryContext - Streaks fetched:', data);
          
          setStreaks({
            flashcard: {
              current: data.flashcard_current_streak || 0,
              best: data.flashcard_all_time_high || 0
            },
            questionOfDay: {
              current: data.question_of_day_streak || 0,
              best: data.question_of_day_best_streak || 0
            }
          });
        } else {
          // Create streak data if it doesn't exist
          const { error: insertError } = await supabase
            .from('streak_data')
            .insert([{ user_id: user.id }]);
            
          if (insertError) {
            console.error('DEBUG: MemoryContext - Error creating streaks:', insertError);
          }
        }
      } catch (error) {
        console.error('DEBUG: MemoryContext - Error in fetchStreaks:', error);
      }
    };

    fetchStreaks();
  }, [user]);

  const addMemory = async (memoryData) => {
    console.log('DEBUG: MemoryContext - Adding new memory:', memoryData);
    
    if (!user) {
      console.error('DEBUG: MemoryContext - Add Memory - User not logged in');
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

      console.log('DEBUG: MemoryContext - Inserting memory into dates_esm1234567:', newMemory);

      const { data, error } = await supabase
        .from('dates_esm1234567')
        .insert([newMemory])
        .select()
        .single();

      if (error) {
        console.error('DEBUG: MemoryContext - Supabase INSERT error:', error);
        throw new Error(`Failed to save memory: ${error.message}`);
      }

      console.log('DEBUG: MemoryContext - Memory inserted successfully:', data);

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
      console.error('DEBUG: MemoryContext - Error in addMemory:', error);
      throw error;
    }
  };

  const updateMemory = async (id, memoryData) => {
    try {
      const [month, day] = memoryData.date.split('/').map(Number);
      
      const updateData = {
        name: memoryData.name.trim(),
        display_name: memoryData.type === 'birthday' 
          ? `${memoryData.name.trim()}'s Birthday` 
          : memoryData.name.trim(),
        month,
        day,
        category: memoryData.type.charAt(0).toUpperCase() + memoryData.type.slice(1),
        updated_at: new Date()
      };
      
      const { error } = await supabase
        .from('dates_esm1234567')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update memory in state
      setMemories(prev => prev.map(memory => {
        if (memory.id === id) {
          return {
            ...memory,
            name: memoryData.name,
            displayName: updateData.display_name,
            type: memoryData.type,
            date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
            month,
            day,
            category: updateData.category,
            daysUntil: calculateDaysUntil(month, day)
          };
        }
        return memory;
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  };

  const deleteMemory = async (id) => {
    try {
      const { error } = await supabase
        .from('dates_esm1234567')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Remove memory from state
      setMemories(prev => prev.filter(memory => memory.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  };

  const getDisplayName = useCallback((memory) => {
    return memory.displayName || (memory.type === 'birthday' ? `${memory.name}'s Birthday` : memory.name);
  }, []);

  const getUpcomingDates = useCallback(() => {
    return [...memories]
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .filter(memory => memory.daysUntil >= 0);
  }, [memories]);

  const getMemoriesForQuiz = useCallback(() => {
    // Here you'd implement spaced repetition logic based on correctCount, incorrectCount
    // For now, just return all memories in random order
    return [...memories].sort(() => Math.random() - 0.5);
  }, [memories]);

  const submitFlashcardAnswer = async (memoryId, isCorrect) => {
    try {
      // Update memory stats in database
      const memoryToUpdate = memories.find(m => m.id === memoryId);
      
      if (!memoryToUpdate) throw new Error('Memory not found');
      
      const updates = {
        correct_count: (memoryToUpdate.correctCount || 0) + (isCorrect ? 1 : 0),
        incorrect_count: (memoryToUpdate.incorrectCount || 0) + (isCorrect ? 0 : 1),
      };
      
      const { error } = await supabase
        .from('dates_esm1234567')
        .update(updates)
        .eq('id', memoryId);
        
      if (error) throw error;
      
      // Update memory in state
      setMemories(prev => prev.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            correctCount: (memory.correctCount || 0) + (isCorrect ? 1 : 0),
            incorrectCount: (memory.incorrectCount || 0) + (isCorrect ? 0 : 1)
          };
        }
        return memory;
      }));
      
      // Update streak
      await updateStreak(isCorrect, 'flashcard');
      
      return true;
    } catch (error) {
      console.error('Error submitting flashcard answer:', error);
      throw error;
    }
  };

  const updateStreak = async (isCorrect, streakType = 'flashcard') => {
    try {
      if (!user) return;
      
      // Get current streak data
      const { data, error } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      let currentStreak = 0;
      let bestStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      if (data) {
        // Update streak based on answer
        if (streakType === 'flashcard') {
          currentStreak = isCorrect ? (data.flashcard_current_streak || 0) + 1 : 0;
          bestStreak = Math.max(currentStreak, data.flashcard_all_time_high || 0);
          
          const updates = {
            flashcard_current_streak: currentStreak,
            flashcard_all_time_high: bestStreak,
            last_flashcard_date: today
          };
          
          await supabase
            .from('streak_data')
            .update(updates)
            .eq('user_id', user.id);
        } else if (streakType === 'questionOfDay') {
          currentStreak = isCorrect ? (data.question_of_day_streak || 0) + 1 : 0;
          bestStreak = Math.max(currentStreak, data.question_of_day_best_streak || 0);
          
          const updates = {
            question_of_day_streak: currentStreak,
            question_of_day_best_streak: bestStreak,
            last_qod_date: today
          };
          
          await supabase
            .from('streak_data')
            .update(updates)
            .eq('user_id', user.id);
        }
      } else {
        // Create streak data if it doesn't exist
        currentStreak = isCorrect ? 1 : 0;
        bestStreak = currentStreak;
        
        const newStreakData = {
          user_id: user.id,
          flashcard_current_streak: streakType === 'flashcard' ? currentStreak : 0,
          flashcard_all_time_high: streakType === 'flashcard' ? bestStreak : 0,
          last_flashcard_date: streakType === 'flashcard' ? today : null,
          question_of_day_streak: streakType === 'questionOfDay' ? currentStreak : 0,
          question_of_day_best_streak: streakType === 'questionOfDay' ? bestStreak : 0,
          last_qod_date: streakType === 'questionOfDay' ? today : null
        };
        
        await supabase
          .from('streak_data')
          .insert([newStreakData]);
      }
      
      // Update streaks in state
      setStreaks(prev => ({
        ...prev,
        [streakType === 'flashcard' ? 'flashcard' : 'questionOfDay']: {
          current: currentStreak,
          best: bestStreak
        }
      }));
      
      return { current: currentStreak, best: bestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { current: 0, best: 0 };
    }
  };

  const hasAnsweredTodaysQuestion = useCallback(() => {
    try {
      if (!user) return false;
      
      const today = new Date().toISOString().split('T')[0];
      
      // In a real implementation, you'd check the database
      // For now, we'll just use local state (this would reset on page refresh)
      const lastQodDate = localStorage.getItem(`last_qod_date_${user.id}`);
      return lastQodDate === today;
    } catch (error) {
      console.error('Error checking if today\'s question is answered:', error);
      return false;
    }
  }, [user]);

  const markTodaysQuestionAsAnswered = async (isCorrect) => {
    try {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`last_qod_date_${user.id}`, today);
      
      // Update streak for question of the day
      await updateStreak(isCorrect, 'questionOfDay');
      
      return true;
    } catch (error) {
      console.error('Error marking today\'s question as answered:', error);
      return false;
    }
  };

  const getNeedsPracticeMemories = useCallback(async (limit = 5) => {
    try {
      // In a real implementation, you'd calculate this based on correctCount, incorrectCount
      // For now, just return random memories
      return [...memories]
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
        .map(memory => ({
          ...memory,
          recall_percentage: Math.floor(Math.random() * 60) + 20 // Random 20-80%
        }));
    } catch (error) {
      console.error('Error getting practice memories:', error);
      return [];
    }
  }, [memories]);

  // Context value
  const value = {
    memories,
    loading,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    getDisplayName,
    getUpcomingDates,
    getMemoriesForQuiz,
    submitFlashcardAnswer,
    updateStreak,
    hasAnsweredTodaysQuestion,
    markTodaysQuestionAsAnswered,
    getNeedsPracticeMemories,
    streaks
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export default MemoryProvider;