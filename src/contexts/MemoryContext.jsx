import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { differenceInDays } from 'date-fns';

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
  const [streaks, setStreaks] = useState({
    questionOfDay: { current: 0, best: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMemories = async () => {
      if (!user) {
        console.log("DEBUG: MemoryContext - No user authenticated, clearing memories");
        setMemories([]);
        setStreaks({ questionOfDay: { current: 0, best: 0 } });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("DEBUG: MemoryContext - Loading memories for user:", user.id);

        // Fetch user-specific memories
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('dates_esm1234567')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (memoriesError) {
          console.error('DEBUG: MemoryContext - Error fetching memories:', memoriesError);
          setError('Failed to load memories. Please try again.');
          return;
        }

        console.log(`DEBUG: MemoryContext - Successfully loaded ${memoriesData?.length || 0} memories`);

        // Process memories for frontend use
        const processedMemories = (memoriesData || []).map(memory => {
          const formattedDate = `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`;
          const daysUntil = calculateDaysUntil(memory.month, memory.day);

          return {
            ...memory,
            date: formattedDate,
            daysUntil: daysUntil,
            correctCount: 0,
            incorrectCount: 0,
            title: memory.name,
            memory_type: memory.category.toLowerCase(),
            type: memory.category.toLowerCase()
          };
        });

        setMemories(processedMemories);

        // Load streak data
        const { data: streakData, error: streakError } = await supabase
          .from('streak_data_esm1234567')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!streakError && streakData) {
          setStreaks({
            questionOfDay: {
              current: streakData.qotd_current_streak || 0,
              best: streakData.qotd_all_time_high || 0,
              lastAnswered: streakData.last_qod_date
            }
          });
        }

      } catch (error) {
        console.error('DEBUG: MemoryContext - Unexpected error loading memories:', error);
        setError('An unexpected error occurred while loading your memories.');
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [user]);

  const calculateDaysUntil = (month, day) => {
    const today = new Date();
    const memoryDate = new Date(today.getFullYear(), month - 1, day);
    if (memoryDate < today) {
      memoryDate.setFullYear(today.getFullYear() + 1);
    }
    return differenceInDays(memoryDate, today);
  };

  const addMemory = async (memoryData) => {
    console.log("DEBUG: MemoryContext.addMemory - Starting automatic save process");
    console.log("DEBUG: MemoryContext.addMemory - Input data:", memoryData);

    if (!user || !user.id) {
      const errorMsg = 'You must be logged in to add a memory';
      console.error("DEBUG: MemoryContext.addMemory - User not authenticated:", errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Validate required fields
      if (!memoryData.name || !memoryData.name.trim()) {
        throw new Error('Please enter a name for the memory');
      }

      if (!memoryData.date || !/^\d{2}\/\d{2}$/.test(memoryData.date)) {
        throw new Error('Please select a valid date');
      }

      if (!memoryData.type) {
        throw new Error('Please select a memory type');
      }

      // Parse date from MM/DD format
      const [month, day] = memoryData.date.split('/').map(Number);
      console.log("DEBUG: MemoryContext.addMemory - Parsed date:", { month, day });

      // Generate display name based on category
      let displayName = memoryData.name.trim();
      if (memoryData.type === 'birthday') {
        displayName = `${memoryData.name.trim()}'s Birthday`;
      } else if (memoryData.type === 'anniversary') {
        displayName = `${memoryData.name.trim()} Anniversary`;
      }

      // Construct payload for database
      const payload = {
        user_id: user.id,
        name: memoryData.name.trim(),
        display_name: displayName,
        month: month,
        day: day,
        category: memoryData.type.charAt(0).toUpperCase() + memoryData.type.slice(1)
      };

      console.log("DEBUG: MemoryContext.addMemory - Inserting payload:", payload);

      // Insert into database
      const { data, error } = await supabase
        .from('dates_esm1234567')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("DEBUG: MemoryContext.addMemory - Database error:", error);
        
        if (error.code === '42501') {
          throw new Error('Permission denied. Please try logging out and back in.');
        } else if (error.code === '23503') {
          throw new Error('Authentication error. Please try logging out and back in.');
        } else if (error.message.includes('duplicate key value')) {
          throw new Error('A memory with this name already exists.');
        } else {
          throw new Error(`Failed to save memory: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Memory was not saved properly. Please try again.');
      }

      console.log("DEBUG: MemoryContext.addMemory - Memory successfully saved:", data);

      // Process the new memory for local state
      const formattedMemory = {
        ...data,
        date: memoryData.date,
        daysUntil: calculateDaysUntil(month, day),
        correctCount: 0,
        incorrectCount: 0,
        title: data.name,
        memory_type: data.category.toLowerCase(),
        type: data.category.toLowerCase()
      };

      // Update local state immediately
      setMemories(prev => {
        const newMemories = [formattedMemory, ...prev];
        console.log("DEBUG: MemoryContext.addMemory - Updated local state with", newMemories.length, "memories");
        return newMemories;
      });

      console.log("DEBUG: MemoryContext.addMemory - Memory addition completed successfully");
      return formattedMemory;

    } catch (error) {
      console.error('DEBUG: MemoryContext.addMemory - Error during memory addition:', error);
      throw error;
    }
  };

  const getMemoriesForQuiz = () => {
    if (memories.length === 0) {
      return [];
    }

    const sortedMemories = [...memories].sort((a, b) => {
      const aTotal = a.correctCount + a.incorrectCount;
      const bTotal = b.correctCount + b.incorrectCount;

      // Prioritize memories that haven't been practiced
      if (aTotal === 0 && bTotal === 0) return a.daysUntil - b.daysUntil;
      if (aTotal === 0) return -1;
      if (bTotal === 0) return 1;

      // Then prioritize by lowest accuracy
      const aAccuracy = a.correctCount / aTotal;
      const bAccuracy = b.correctCount / bTotal;
      return aAccuracy - bAccuracy;
    });

    return sortedMemories;
  };

  const updateStreak = async (isCorrect, type = 'questionOfDay') => {
    if (!user || !user.id) {
      const errorMsg = 'You must be logged in to update streaks';
      throw new Error(errorMsg);
    }

    try {
      // Get current streak data
      let { data: currentStreak, error: fetchError } = await supabase
        .from('streak_data_esm1234567')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch streak data: ${fetchError.message}`);
      }

      if (!currentStreak) {
        const { data: newStreak, error: createError } = await supabase
          .from('streak_data_esm1234567')
          .insert({
            user_id: user.id,
            qotd_current_streak: 0,
            qotd_all_time_high: 0
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create streak data: ${createError.message}`);
        }

        currentStreak = newStreak;
      }

      // Calculate new streak values
      const currentField = 'qotd_current_streak';
      const bestField = 'qotd_all_time_high';
      const dateField = 'last_qod_date';

      const newCurrentStreak = isCorrect ? (currentStreak[currentField] || 0) + 1 : 0;
      const newBestStreak = Math.max(newCurrentStreak, currentStreak[bestField] || 0);
      const today = new Date().toISOString().split('T')[0];

      // Update streak data
      const { data: updatedStreak, error: updateError } = await supabase
        .from('streak_data_esm1234567')
        .update({
          [currentField]: newCurrentStreak,
          [bestField]: newBestStreak,
          [dateField]: today
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update streak: ${updateError.message}`);
      }

      // Update local state
      setStreaks(prev => ({
        ...prev,
        questionOfDay: {
          current: newCurrentStreak,
          best: newBestStreak,
          lastAnswered: today
        }
      }));

      return { current: newCurrentStreak, best: newBestStreak };
    } catch (error) {
      console.error('DEBUG: MemoryContext.updateStreak - Error updating streak:', error);
      throw error;
    }
  };

  const getDisplayName = (memory) => {
    return memory.display_name || (memory.memory_type === 'birthday' ? `${memory.title}'s Birthday` : memory.title);
  };

  const getUpcomingDates = () => {
    const sorted = [...memories].sort((a, b) => a.daysUntil - b.daysUntil);
    return sorted;
  };

  const hasAnsweredTodaysQuestion = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasAnswered = streaks.questionOfDay?.lastAnswered === today;
    return hasAnswered;
  };

  const markTodaysQuestionAsAnswered = async (isCorrect) => {
    try {
      const result = await updateStreak(isCorrect, 'questionOfDay');
      return result;
    } catch (error) {
      console.error('DEBUG: MemoryContext.markTodaysQuestionAsAnswered - Error:', error);
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