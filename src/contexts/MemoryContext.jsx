import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { format, addDays, differenceInDays } from 'date-fns';

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
    flashcard: { current: 0, best: 0 },
    questionOfDay: { current: 0, best: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's memories when authenticated
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

        // Fetch memories
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('dates_esm1234567')
          .select('*')
          .eq('user_id', user.id)
          .order('date_month', { ascending: true })
          .order('date_day', { ascending: true });

        if (memoriesError) {
          console.error('Error fetching memories:', memoriesError);
          setError('Failed to load memories. Please try again.');
          setLoading(false);
          return;
        }

        // Process memories for display
        const processedMemories = memoriesData.map(memory => {
          const formattedDate = `${String(memory.date_month).padStart(2, '0')}/${String(memory.date_day).padStart(2, '0')}`;
          
          // Calculate days until this date (for upcoming dates)
          const today = new Date();
          const memoryDate = new Date(today.getFullYear(), memory.date_month - 1, memory.date_day);
          
          // If the date has passed this year, calculate for next year
          if (memoryDate < today) {
            memoryDate.setFullYear(today.getFullYear() + 1);
          }
          
          const daysUntil = differenceInDays(memoryDate, today);
          
          return {
            ...memory,
            date: formattedDate,
            daysUntil,
            correctCount: 0, // Will be updated from practice sessions
            incorrectCount: 0 // Will be updated from practice sessions
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

        // Fetch streak data
        const { data: streakData, error: streakError } = await supabase
          .from('streak_data_esm1234567')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (streakError && streakError.code !== 'PGRST116') {
          // PGRST116 is "No rows returned" error, which is expected for new users
          console.error('Error fetching streak data:', streakError);
        }

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
        } else {
          // Create streak data for new user
          const { error: createStreakError } = await supabase
            .from('streak_data_esm1234567')
            .insert({ user_id: user.id });

          if (createStreakError) {
            console.error('Error creating streak data:', createStreakError);
          }
        }
      } catch (err) {
        console.error('Error in loadMemories:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
  }, [user]);

  // Add a new memory
  const addMemory = async (memoryData) => {
    if (!user) {
      throw new Error('You must be logged in to add a memory');
    }

    try {
      // Parse date (MM/DD format)
      const [month, day] = memoryData.date.split('/').map(Number);

      const newMemory = {
        user_id: user.id,
        date_month: month,
        date_day: day,
        event_name: memoryData.name,
        event_type: memoryData.type,
        notes: memoryData.notes || null
      };

      // Insert into database
      const { data, error } = await supabase
        .from('dates_esm1234567')
        .insert(newMemory)
        .select()
        .single();

      if (error) {
        console.error('Error adding memory:', error);
        throw new Error(error.message || 'Failed to add memory');
      }

      // Format for state
      const formattedMemory = {
        ...data,
        date: memoryData.date,
        correctCount: 0,
        incorrectCount: 0,
        daysUntil: calculateDaysUntil(month, day)
      };

      // Update state
      setMemories(prev => [...prev, formattedMemory]);

      return formattedMemory;
    } catch (error) {
      console.error('Error in addMemory:', error);
      throw error;
    }
  };

  // Update a memory
  const updateMemory = async (id, memoryData) => {
    if (!user) {
      throw new Error('You must be logged in to update a memory');
    }

    try {
      // Parse date (MM/DD format)
      const [month, day] = memoryData.date.split('/').map(Number);

      const updatedMemory = {
        event_name: memoryData.name,
        date_month: month,
        date_day: day,
        event_type: memoryData.type,
        notes: memoryData.notes || null
      };

      // Update in database
      const { data, error } = await supabase
        .from('dates_esm1234567')
        .update(updatedMemory)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating memory:', error);
        throw new Error(error.message || 'Failed to update memory');
      }

      // Update state
      setMemories(prev => prev.map(memory => 
        memory.id === id 
          ? { 
              ...data, 
              date: memoryData.date,
              correctCount: memory.correctCount,
              incorrectCount: memory.incorrectCount,
              daysUntil: calculateDaysUntil(month, day)
            } 
          : memory
      ));

      return data;
    } catch (error) {
      console.error('Error in updateMemory:', error);
      throw error;
    }
  };

  // Delete a memory
  const deleteMemory = async (id) => {
    if (!user) {
      throw new Error('You must be logged in to delete a memory');
    }

    try {
      const { error } = await supabase
        .from('dates_esm1234567')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting memory:', error);
        throw new Error(error.message || 'Failed to delete memory');
      }

      // Update state
      setMemories(prev => prev.filter(memory => memory.id !== id));

      return true;
    } catch (error) {
      console.error('Error in deleteMemory:', error);
      throw error;
    }
  };

  // Submit a flashcard answer and update streaks
  const submitFlashcardAnswer = async (memoryId, isCorrect) => {
    if (!user) {
      throw new Error('You must be logged in to submit an answer');
    }

    try {
      // Record practice session
      const { error: sessionError } = await supabase
        .from('practice_sessions_esm1234567')
        .insert({
          user_id: user.id,
          date_id: memoryId,
          is_correct: isCorrect,
          session_type: 'Flashcard'
        });

      if (sessionError) {
        console.error('Error recording practice session:', sessionError);
        throw new Error(sessionError.message || 'Failed to record practice');
      }

      // Update memory stats in state
      setMemories(prev => prev.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            correctCount: memory.correctCount + (isCorrect ? 1 : 0),
            incorrectCount: memory.incorrectCount + (isCorrect ? 0 : 1)
          };
        }
        return memory;
      }));

      // Update date's last_practiced_at
      await supabase
        .from('dates_esm1234567')
        .update({ last_practiced_at: new Date().toISOString() })
        .eq('id', memoryId)
        .eq('user_id', user.id);

      // Update streaks
      await updateStreak(isCorrect, 'flashcard');

      return true;
    } catch (error) {
      console.error('Error in submitFlashcardAnswer:', error);
      throw error;
    }
  };

  // Update streak values
  const updateStreak = async (isCorrect, streakType = 'flashcard') => {
    if (!user) {
      throw new Error('You must be logged in to update streaks');
    }

    try {
      // Get current streak data
      let { data: currentStreakData, error: fetchError } = await supabase
        .from('streak_data_esm1234567')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching streak data:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch streak data');
      }

      // Initialize streak data if not exists
      if (!currentStreakData) {
        const { data, error: insertError } = await supabase
          .from('streak_data_esm1234567')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating streak data:', insertError);
          throw new Error(insertError.message || 'Failed to create streak data');
        }

        currentStreakData = data;
      }

      // Determine which streak to update
      let currentStreakField, allTimeHighField, lastDateField;
      if (streakType === 'flashcard') {
        currentStreakField = 'flashcard_current_streak';
        allTimeHighField = 'flashcard_all_time_high';
        lastDateField = 'last_flashcard_date';
      } else {
        currentStreakField = 'qotd_current_streak';
        allTimeHighField = 'qotd_all_time_high';
        lastDateField = 'last_qod_date';
      }

      // Calculate new streak values
      let newCurrentStreak = isCorrect 
        ? (currentStreakData[currentStreakField] || 0) + 1 
        : 0;
        
      let newAllTimeHigh = Math.max(
        newCurrentStreak,
        currentStreakData[allTimeHighField] || 0
      );

      // Update in database
      const { error: updateError } = await supabase
        .from('streak_data_esm1234567')
        .update({
          [currentStreakField]: newCurrentStreak,
          [allTimeHighField]: newAllTimeHigh,
          [lastDateField]: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating streak data:', updateError);
        throw new Error(updateError.message || 'Failed to update streak data');
      }

      // Update state
      setStreaks(prev => ({
        ...prev,
        [streakType === 'flashcard' ? 'flashcard' : 'questionOfDay']: {
          current: newCurrentStreak,
          best: newAllTimeHigh
        }
      }));

      return {
        current: newCurrentStreak,
        best: newAllTimeHigh
      };
    } catch (error) {
      console.error('Error in updateStreak:', error);
      throw error;
    }
  };

  // Answer the Question of the Day and update streak
  const markTodaysQuestionAsAnswered = async (isCorrect) => {
    try {
      return await updateStreak(isCorrect, 'questionOfDay');
    } catch (error) {
      console.error('Error in markTodaysQuestionAsAnswered:', error);
      throw error;
    }
  };

  // Check if user has already answered today's question
  const hasAnsweredTodaysQuestion = () => {
    // This would typically check the last_qod_date in streak_data
    // For now, we'll return false to always show the question
    return false;
  };

  // Get memories for quiz, prioritizing those that need practice
  const getMemoriesForQuiz = () => {
    if (memories.length === 0) return [];

    // Sort memories by recall percentage (if available) or by last practiced date
    return [...memories].sort((a, b) => {
      // If no practice data, prioritize
      const aTotal = a.correctCount + a.incorrectCount;
      const bTotal = b.correctCount + b.incorrectCount;
      
      if (aTotal === 0 && bTotal === 0) {
        // Both have no practice data, sort by upcoming date
        return a.daysUntil - b.daysUntil;
      }
      
      if (aTotal === 0) return -1;
      if (bTotal === 0) return 1;
      
      // Calculate accuracy
      const aAccuracy = a.correctCount / aTotal;
      const bAccuracy = b.correctCount / bTotal;
      
      // Lower accuracy first
      return aAccuracy - bAccuracy;
    });
  };

  // Helper function to calculate days until a date
  const calculateDaysUntil = (month, day) => {
    const today = new Date();
    const memoryDate = new Date(today.getFullYear(), month - 1, day);
    
    // If the date has passed this year, calculate for next year
    if (memoryDate < today) {
      memoryDate.setFullYear(today.getFullYear() + 1);
    }
    
    return differenceInDays(memoryDate, today);
  };

  // Helper function for displaying memory names
  const getDisplayName = (memory) => {
    return memory.event_type === 'birthday' 
      ? `${memory.event_name}'s Birthday` 
      : memory.event_name;
  };

  // Get upcoming dates sorted by proximity
  const getUpcomingDates = () => {
    return [...memories].sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const value = {
    memories,
    streaks,
    loading,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    submitFlashcardAnswer,
    updateStreak,
    getDisplayName,
    getUpcomingDates,
    getMemoriesForQuiz,
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