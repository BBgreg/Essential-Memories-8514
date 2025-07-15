import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';

const MemoryContext = createContext({});

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

export const MemoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [streaks, setStreaks] = useState({
    questionOfDay: { current: 0, best: 0 },
    flashcard: { current: 0, best: 0 }
  });

  console.log('[MemoryContext] State:', {
    hasUser: !!user,
    userId: user?.id ? user.id.substring(0, 8) + '...' : 'none',
    memoriesCount: memories.length,
    loading,
    error,
    dataFetchAttempted
  });

  // Verify user authentication and profile existence
  const verifyUserProfile = async () => {
    if (!user?.id) {
      console.error('[MemoryContext] No authenticated user found');
      throw new Error('No authenticated user found');
    }

    console.log('[MemoryContext] Verifying user profile for:', user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[MemoryContext] Profile verification failed:', profileError);
      throw new Error('User profile verification failed. Please try logging out and back in.');
    }

    if (!profile) {
      console.log('[MemoryContext] No profile found, creating one...');
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || null,
            created_at: new Date().toISOString()
          }
        ]);

      if (createError) {
        console.error('[MemoryContext] Failed to create profile:', createError);
        throw new Error('Failed to create user profile');
      }

      console.log('[MemoryContext] Profile created successfully');
    }

    return user.id;
  };

  // Format date for database
  const parseDateToDb = (dateString) => {
    try {
      const [month, day] = dateString.split('/').map(Number);
      return { month, day };
    } catch (error) {
      throw new Error('Invalid date format. Expected MM/DD');
    }
  };

  // Add a new memory
  const addMemory = async (memoryData) => {
    try {
      setError(null);
      console.log('[MemoryContext] Adding memory:', memoryData);

      // CRITICAL: Verify we have a valid user ID from the current session
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) {
        console.error('[MemoryContext] No authenticated user found in current session');
        throw new Error('You must be logged in to add a memory. Please try logging out and back in.');
      }

      // Use the explicit user ID from the current auth session
      const userId = currentUser.id;
      console.log('[MemoryContext] Using authenticated user ID for memory:', userId);

      // Parse date
      const { month, day } = parseDateToDb(memoryData.date);

      // Prepare memory data
      const memoryToInsert = {
        user_id: userId, // CRITICAL: Use the explicit user ID
        name: memoryData.name.trim(),
        display_name: memoryData.type === 'birthday' ? `${memoryData.name.trim()}'s Birthday` : memoryData.name.trim(),
        month,
        day,
        category: memoryData.type,
        created_at: new Date().toISOString(),
        correct_count: 0,
        incorrect_count: 0
      };

      console.log('[MemoryContext] Attempting to insert memory with data:', {
        ...memoryToInsert,
        user_id: `${memoryToInsert.user_id.substring(0, 8)}...` // Log partial UUID for privacy
      });

      // Insert into database
      const { data, error: insertError } = await supabase
        .from('dates')
        .insert(memoryToInsert)
        .select()
        .single();

      if (insertError) {
        console.error('[MemoryContext] Error inserting memory:', insertError);
        throw new Error(`Failed to save memory: ${insertError.message}`);
      }

      if (!data) {
        console.error('[MemoryContext] No data returned from insert operation');
        throw new Error('Memory was not saved properly. Please try again.');
      }

      console.log('[MemoryContext] Memory inserted successfully, returned data:', data);

      // Update local state
      const newMemory = {
        ...data,
        date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
        correctCount: data.correct_count || 0,
        incorrectCount: data.incorrect_count || 0
      };

      setMemories(prev => [newMemory, ...prev]);
      console.log('[MemoryContext] Memory added successfully:', newMemory);

      return newMemory;
    } catch (error) {
      console.error('[MemoryContext] Error in addMemory:', error);
      setError(error.message);
      throw error;
    }
  };

  // Load memories for the current user
  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[MemoryContext] Loading memories for user:', user?.id);

      if (!user?.id) {
        console.log('[MemoryContext] No user found, skipping memory load');
        setMemories([]);
        return;
      }

      // Get the current user ID directly from auth
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) {
        console.error('[MemoryContext] No authenticated user found in current session during loadMemories');
        throw new Error('Authentication session error. Please try logging out and back in.');
      }

      console.log('[MemoryContext] Using authenticated user ID for loading memories:', currentUser.id);

      // Verify user profile first
      await verifyUserProfile();
      console.log('[MemoryContext] Fetching memories from database...');

      const { data, error: fetchError } = await supabase
        .from('dates')
        .select('*')
        .eq('user_id', currentUser.id); // CRITICAL: Use the explicit user ID

      if (fetchError) {
        console.error('[MemoryContext] Error fetching memories:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('[MemoryContext] Raw memories data from database:', data);

      // Format dates for display
      const formattedMemories = data.map(memory => ({
        ...memory,
        date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`,
        correctCount: memory.correct_count || 0,
        incorrectCount: memory.incorrect_count || 0
      }));

      console.log('[MemoryContext] Formatted memories:', formattedMemories);
      setMemories(formattedMemories);
    } catch (error) {
      console.error('[MemoryContext] Error loading memories:', error);
      setError(error.message);
      // Don't throw error here to prevent app crash
    } finally {
      setLoading(false);
      setDataFetchAttempted(true);
    }
  };

  // Retry loading memories
  const retryLoadMemories = () => {
    console.log('[MemoryContext] Retrying memory load...');
    setError(null);
    setDataFetchAttempted(false);
    loadMemories();
  };

  // Load streaks data
  const loadStreaks = async () => {
    if (!user?.id) return;

    try {
      // Get the current user ID directly from auth
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) {
        console.error('[MemoryContext] No authenticated user found in current session during loadStreaks');
        return;
      }

      console.log('[MemoryContext] Loading streaks for user:', currentUser.id);

      const { data, error } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', currentUser.id) // CRITICAL: Use the explicit user ID
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[MemoryContext] Error loading streaks:', error);
        return;
      }

      if (data) {
        console.log('[MemoryContext] Streaks loaded:', data);
        setStreaks({
          questionOfDay: {
            current: data.question_of_day_streak || 0,
            best: data.best_question_of_day_streak || 0
          },
          flashcard: {
            current: data.flashcard_streak || 0,
            best: data.best_flashcard_streak || 0
          }
        });
      } else {
        console.log('[MemoryContext] No streak data found, initializing streaks record...');
        // Create initial streak record if it doesn't exist
        const { error: createError } = await supabase
          .from('streak_data')
          .insert([
            {
              user_id: currentUser.id,
              question_of_day_streak: 0,
              best_question_of_day_streak: 0,
              flashcard_streak: 0,
              best_flashcard_streak: 0,
              last_question_date: null,
              created_at: new Date().toISOString()
            }
          ]);

        if (createError) {
          console.error('[MemoryContext] Error creating streak record:', createError);
        } else {
          console.log('[MemoryContext] Initial streak record created successfully');
        }
      }
    } catch (error) {
      console.error('[MemoryContext] Error in loadStreaks:', error);
    }
  };

  // Get display name for a memory (handles birthday suffix)
  const getDisplayName = (memory) => {
    return memory.display_name || memory.name;
  };

  // Get upcoming dates
  const getUpcomingDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    return memories.map(memory => {
      const [month, day] = memory.date.split('/').map(Number);
      let nextDate = new Date(currentYear, month - 1, day);

      // If the date has passed this year, use next year
      if (nextDate < today) {
        nextDate = new Date(currentYear + 1, month - 1, day);
      }

      const timeDiff = nextDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return { ...memory, nextDate, daysUntil };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Get memories for quiz (placeholder - implement SRS logic)
  const getMemoriesForQuiz = () => {
    return memories.slice(0, 5); // Simple implementation
  };

  // Submit flashcard answer (placeholder)
  const submitFlashcardAnswer = async (memoryId, correct) => {
    console.log('[MemoryContext] Flashcard answer submitted:', { memoryId, correct });

    try {
      const memory = memories.find(m => m.id === memoryId);
      if (!memory) return;

      // Update local state first for immediate UI feedback
      const updatedMemories = memories.map(m => {
        if (m.id === memoryId) {
          return {
            ...m,
            correctCount: correct ? m.correctCount + 1 : m.correctCount,
            incorrectCount: correct ? m.incorrectCount : m.incorrectCount + 1
          };
        }
        return m;
      });

      setMemories(updatedMemories);

      // Then update the database
      const { error } = await supabase
        .from('dates')
        .update({
          correct_count: correct ? (memory.correctCount || 0) + 1 : (memory.correctCount || 0),
          incorrect_count: correct ? (memory.incorrectCount || 0) : (memory.incorrectCount || 0) + 1
        })
        .eq('id', memoryId);

      if (error) {
        console.error('[MemoryContext] Error updating flashcard stats:', error);
      }
    } catch (error) {
      console.error('[MemoryContext] Error in submitFlashcardAnswer:', error);
    }
  };

  // Check if today's question has been answered (placeholder)
  const hasAnsweredTodaysQuestion = () => {
    // TODO: Implement logic to check if today's question was answered
    return false;
  };

  // Mark today's question as answered (placeholder)
  const markTodaysQuestionAsAnswered = async (correct, memoryId) => {
    console.log('[MemoryContext] Marking today\'s question as answered:', { correct, memoryId });

    try {
      // Update the memory's stats if provided
      if (memoryId) {
        await submitFlashcardAnswer(memoryId, correct);
      }

      // Get current user
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) return;

      // Update streak
      const today = new Date().toISOString().split('T')[0];

      // Get current streak data
      const { data: streakData, error: streakError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        console.error('[MemoryContext] Error fetching streak data:', streakError);
        return;
      }

      let newStreak = 1; // Start with 1 for today
      let bestStreak = 0;

      if (streakData) {
        const lastQuestionDate = streakData.last_question_date;
        bestStreak = streakData.best_question_of_day_streak || 0;

        // Check if streak continues
        if (lastQuestionDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastQuestionDate === yesterdayStr) {
            newStreak = (streakData.question_of_day_streak || 0) + 1;
          }
        }

        // Update best streak if needed
        if (newStreak > bestStreak) {
          bestStreak = newStreak;
        }

        // Update streak data
        const { error: updateError } = await supabase
          .from('streak_data')
          .update({
            question_of_day_streak: newStreak,
            best_question_of_day_streak: bestStreak,
            last_question_date: today
          })
          .eq('user_id', currentUser.id);

        if (updateError) {
          console.error('[MemoryContext] Error updating streak data:', updateError);
        } else {
          // Update local state
          setStreaks(prev => ({
            ...prev,
            questionOfDay: { current: newStreak, best: bestStreak }
          }));
        }
      } else {
        // Create initial streak record
        const { error: createError } = await supabase
          .from('streak_data')
          .insert([
            {
              user_id: currentUser.id,
              question_of_day_streak: 1,
              best_question_of_day_streak: 1,
              flashcard_streak: 0,
              best_flashcard_streak: 0,
              last_question_date: today,
              created_at: new Date().toISOString()
            }
          ]);

        if (createError) {
          console.error('[MemoryContext] Error creating streak record:', createError);
        } else {
          setStreaks(prev => ({
            ...prev,
            questionOfDay: { current: 1, best: 1 }
          }));
        }
      }
    } catch (error) {
      console.error('[MemoryContext] Error in markTodaysQuestionAsAnswered:', error);
    }
  };

  // Reload memories when user changes
  useEffect(() => {
    console.log('[MemoryContext] User changed, user:', user?.id);
    
    if (user?.id) {
      loadMemories();
      loadStreaks();
    } else {
      console.log('[MemoryContext] No user, clearing memories and resetting state');
      setMemories([]);
      setStreaks({
        questionOfDay: { current: 0, best: 0 },
        flashcard: { current: 0, best: 0 }
      });
      setLoading(false);
      setDataFetchAttempted(true);
    }
  }, [user]);

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