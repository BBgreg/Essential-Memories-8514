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

  console.log('MemoryContext state:', {
    hasUser: !!user,
    userId: user?.id?.substring(0, 8) + '...' || 'none',
    memoriesCount: memories.length,
    loading,
    error,
    dataFetchAttempted
  });

  // Verify user authentication and profile existence
  const verifyUserProfile = async () => {
    if (!user?.id) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    console.log('Verifying user profile for:', user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile verification failed:', profileError);
      throw new Error('User profile verification failed. Please try logging out and back in.');
    }

    if (!profile) {
      console.log('No profile found, creating one...');
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
        console.error('Failed to create profile:', createError);
        throw new Error('Failed to create user profile');
      }

      console.log('Profile created successfully');
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
      console.log('Adding memory:', memoryData);

      // CRITICAL: Verify we have a valid user ID from the current session
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) {
        console.error('No authenticated user found in current session');
        throw new Error('You must be logged in to add a memory. Please try logging out and back in.');
      }
      
      // Use the explicit user ID from the current auth session
      const userId = currentUser.id;
      console.log('Using authenticated user ID for memory:', userId);

      // Parse date
      const { month, day } = parseDateToDb(memoryData.date);

      // Prepare memory data
      const memoryToInsert = {
        user_id: userId, // CRITICAL: Use the explicit user ID
        name: memoryData.name.trim(),
        display_name: memoryData.type === 'birthday' 
          ? `${memoryData.name.trim()}'s Birthday` 
          : memoryData.name.trim(),
        month,
        day,
        category: memoryData.type
      };

      console.log('Attempting to insert memory with data:', {
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
        console.error('Error inserting memory:', insertError);
        throw new Error(`Failed to save memory: ${insertError.message}`);
      }

      if (!data) {
        console.error('No data returned from insert operation');
        throw new Error('Memory was not saved properly. Please try again.');
      }

      console.log('Memory inserted successfully, returned data:', data);

      // Update local state
      const newMemory = {
        ...data,
        date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
      };

      setMemories(prev => [newMemory, ...prev]);
      console.log('Memory added successfully:', newMemory);
      return newMemory;
    } catch (error) {
      console.error('Error in addMemory:', error);
      setError(error.message);
      throw error;
    }
  };

  // Load memories for the current user
  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading memories for user:', user?.id);

      if (!user?.id) {
        console.log('No user found, skipping memory load');
        setMemories([]);
        return;
      }

      // Get the current user ID directly from auth
      const currentUser = supabase.auth.currentUser;
      if (!currentUser || !currentUser.id) {
        console.error('No authenticated user found in current session during loadMemories');
        throw new Error('Authentication session error. Please try logging out and back in.');
      }
      
      console.log('Using authenticated user ID for loading memories:', currentUser.id);

      // Verify user profile first
      await verifyUserProfile();

      console.log('Fetching memories from database...');
      const { data, error: fetchError } = await supabase
        .from('dates')
        .select('*')
        .eq('user_id', currentUser.id); // CRITICAL: Use the explicit user ID

      if (fetchError) {
        console.error('Error fetching memories:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('Raw memories data from database:', data);

      // Format dates for display
      const formattedMemories = data.map(memory => ({
        ...memory,
        date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`
      }));

      console.log('Formatted memories:', formattedMemories);
      setMemories(formattedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
      setError(error.message);
      // Don't throw error here to prevent app crash
    } finally {
      setLoading(false);
      setDataFetchAttempted(true);
    }
  };

  // Retry loading memories
  const retryLoadMemories = () => {
    console.log('Retrying memory load...');
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
        console.error('No authenticated user found in current session during loadStreaks');
        return;
      }
      
      console.log('Loading streaks for user:', currentUser.id);
      const { data, error } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', currentUser.id) // CRITICAL: Use the explicit user ID
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading streaks:', error);
        return;
      }

      if (data) {
        console.log('Streaks loaded:', data);
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
        console.log('No streak data found, using defaults');
      }
    } catch (error) {
      console.error('Error in loadStreaks:', error);
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
      
      return {
        ...memory,
        nextDate,
        daysUntil
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Get memories for quiz (placeholder - implement SRS logic)
  const getMemoriesForQuiz = () => {
    return memories.slice(0, 5); // Simple implementation
  };

  // Submit flashcard answer (placeholder)
  const submitFlashcardAnswer = (memoryId, correct) => {
    console.log('Flashcard answer submitted:', { memoryId, correct });
    // TODO: Implement SRS logic and update database
  };

  // Check if today's question has been answered (placeholder)
  const hasAnsweredTodaysQuestion = () => {
    // TODO: Implement logic to check if today's question was answered
    return false;
  };

  // Mark today's question as answered (placeholder)
  const markTodaysQuestionAsAnswered = (correct, memoryId) => {
    console.log('Marking today\'s question as answered:', { correct, memoryId });
    // TODO: Implement logic to mark question as answered and update streaks
  };

  // Reload memories when user changes
  useEffect(() => {
    console.log('User changed in MemoryContext, user:', user?.id);
    if (user?.id) {
      loadMemories();
      loadStreaks();
    } else {
      console.log('No user, clearing memories and resetting state');
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