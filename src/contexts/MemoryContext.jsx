import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);
  const [streaks, setStreaks] = useState({
    questionOfDay: { current: 0, best: 0 },
    flashcard: { current: 0, best: 0 }
  });

  // Load memories when user changes
  useEffect(() => {
    if (user) {
      loadMemories();
      loadStreaks();
    } else {
      setMemories([]);
      setStreaks({
        questionOfDay: { current: 0, best: 0 },
        flashcard: { current: 0, best: 0 }
      });
      setDataFetchAttempted(false);
    }
  }, [user]);

  const loadMemories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('dates')
        .select(`
          *,
          recall_performance (
            total_correct_recalls,
            total_attempts,
            recall_percentage,
            last_practiced_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading memories:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform data to match app format
      const transformedMemories = data.map(memory => ({
        id: memory.id,
        name: memory.name,
        date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`,
        type: memory.category,
        notes: memory.notes,
        correctCount: memory.recall_performance?.[0]?.total_correct_recalls || 0,
        incorrectCount: (memory.recall_performance?.[0]?.total_attempts || 0) - (memory.recall_performance?.[0]?.total_correct_recalls || 0),
        created_at: memory.created_at
      }));

      setMemories(transformedMemories);
      setDataFetchAttempted(true);
    } catch (error) {
      console.error('Error in loadMemories:', error);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  const loadStreaks = async () => {
    if (!user) return;

    try {
      const { data, error: streakError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        console.error('Error loading streaks:', streakError);
        return;
      }

      if (data) {
        setStreaks({
          questionOfDay: {
            current: data.question_of_day_streak || 0,
            best: data.question_of_day_best_streak || data.question_of_day_streak || 0,
            lastDate: data.last_qod_date
          },
          flashcard: {
            current: data.flashcard_current_streak || data.flashcard_streak || 0,
            best: data.best_flashcard_streak || data.flashcard_all_time_high || data.flashcard_streak || 0
          }
        });
      }
    } catch (error) {
      console.error('Error in loadStreaks:', error);
    }
  };

  const fetchUserStreaks = async () => {
    if (!user) return { currentStreak: 0, bestStreak: 0 };

    try {
      const { data, error } = await supabase
        .from('streak_data')
        .select('flashcard_current_streak, flashcard_streak, best_flashcard_streak, flashcard_all_time_high')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found - create initial streak record
        await supabase.from('streak_data').insert({
          user_id: user.id,
          flashcard_current_streak: 0,
          flashcard_streak: 0,
          best_flashcard_streak: 0,
          flashcard_all_time_high: 0,
          last_flashcard_date: null
        });
        return { currentStreak: 0, bestStreak: 0 };
      } else if (error) {
        console.error('Error fetching streak data:', error);
        return { currentStreak: 0, bestStreak: 0 };
      }

      return {
        currentStreak: data.flashcard_current_streak || data.flashcard_streak || 0,
        bestStreak: data.best_flashcard_streak || data.flashcard_all_time_high || 0
      };
    } catch (error) {
      console.error('Error in fetchUserStreaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  };

  const updateFlashcardStreak = async (isCorrect) => {
    if (!user) return;

    try {
      console.group('🎯 Flashcard Streak Update');
      console.log('Starting streak update - isCorrect:', isCorrect);
      
      // Get current streaks with detailed logging
      const { data: currentData, error: fetchError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('Current DB State:', currentData);
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current streak:', fetchError);
        console.groupEnd();
        return;
      }

      // Calculate new streak values
      let newCurrentStreak = (currentData?.flashcard_current_streak || 0);
      let newBestStreak = (currentData?.best_flashcard_streak || 0);

      if (isCorrect) {
        newCurrentStreak += 1;
        console.log('Incrementing streak from', currentData?.flashcard_current_streak, 'to', newCurrentStreak);
        
        if (newCurrentStreak > newBestStreak) {
          newBestStreak = newCurrentStreak;
          console.log('New best streak achieved:', newBestStreak);
        }
      } else {
        console.log('Incorrect answer - resetting streak to 0');
        newCurrentStreak = 0;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Prepare update payload
      const updatePayload = {
        user_id: user.id,
        flashcard_current_streak: newCurrentStreak,
        flashcard_streak: newCurrentStreak,
        best_flashcard_streak: newBestStreak,
        flashcard_all_time_high: newBestStreak,
        last_flashcard_date: today
      };
      
      console.log('Update payload:', updatePayload);

      // Perform update with upsert
      const { data: updateResult, error: updateError } = await supabase
        .from('streak_data')
        .upsert(updatePayload)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating streak:', updateError);
        console.groupEnd();
        return;
      }

      console.log('Streak update successful:', updateResult);

      // Update local state
      setStreaks(prev => ({
        ...prev,
        flashcard: {
          current: newCurrentStreak,
          best: newBestStreak
        }
      }));

      console.log('Local state updated');
      console.groupEnd();

    } catch (error) {
      console.error('Unexpected error in updateFlashcardStreak:', error);
      console.groupEnd();
    }
  };

  const addMemory = async (memoryData) => {
    if (!user) {
      throw new Error('User must be logged in to add memories');
    }

    try {
      setLoading(true);
      setError(null);

      // Parse MM/DD format
      const [month, day] = memoryData.date.split('/').map(Number);

      const { data, error: insertError } = await supabase
        .from('dates')
        .insert([
          {
            user_id: user.id,
            month: month,
            day: day,
            category: memoryData.type,
            name: memoryData.name,
            notes: memoryData.notes || null
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error adding memory:', insertError);
        setError(insertError.message);
        throw new Error(insertError.message);
      }

      // Transform and add to local state
      const transformedMemory = {
        id: data.id,
        name: data.name,
        date: `${String(data.month).padStart(2, '0')}/${String(data.day).padStart(2, '0')}`,
        type: data.category,
        notes: data.notes,
        correctCount: 0,
        incorrectCount: 0,
        created_at: data.created_at
      };

      setMemories(prev => [transformedMemory, ...prev]);
      return transformedMemory;
    } catch (error) {
      console.error('Error in addMemory:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMemory = async (memoryId, updates) => {
    if (!user) {
      throw new Error('User must be logged in to update memories');
    }

    try {
      setLoading(true);
      setError(null);

      const updateData = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.type) updateData.category = updates.type;
      if (updates.date) {
        const [month, day] = updates.date.split('/').map(Number);
        updateData.month = month;
        updateData.day = day;
      }

      const { data, error: updateError } = await supabase
        .from('dates')
        .update(updateData)
        .eq('id', memoryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating memory:', updateError);
        setError(updateError.message);
        throw new Error(updateError.message);
      }

      // Update local state
      setMemories(prev => prev.map(memory => 
        memory.id === memoryId ? {
          ...memory,
          name: data.name,
          date: `${String(data.month).padStart(2, '0')}/${String(data.day).padStart(2, '0')}`,
          type: data.category,
          notes: data.notes
        } : memory
      ));

      return data;
    } catch (error) {
      console.error('Error in updateMemory:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (memoryId) => {
    if (!user) {
      throw new Error('User must be logged in to delete memories');
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('dates')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting memory:', deleteError);
        setError(deleteError.message);
        throw new Error(deleteError.message);
      }

      // Remove from local state
      setMemories(prev => prev.filter(memory => memory.id !== memoryId));
    } catch (error) {
      console.error('Error in deleteMemory:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitFlashcardAnswer = async (memoryId, correct) => {
    if (!user) return;

    try {
      // First, record the practice session
      const { error } = await supabase
        .from('practice_sessions')
        .insert([
          {
            user_id: user.id,
            date_id: memoryId,
            correct_recall: correct,
            session_date: new Date().toISOString().split('T')[0]
          }
        ]);

      if (error) {
        console.error('Error submitting flashcard answer:', error);
        return;
      }

      // Update local memory state
      setMemories(prev => prev.map(memory => 
        memory.id === memoryId ? {
          ...memory,
          correctCount: correct ? memory.correctCount + 1 : memory.correctCount,
          incorrectCount: correct ? memory.incorrectCount : memory.incorrectCount + 1
        } : memory
      ));

      // Update flashcard streak
      await updateFlashcardStreak(correct);

    } catch (error) {
      console.error('Error in submitFlashcardAnswer:', error);
    }
  };

  const markTodaysQuestionAsAnswered = async (correct, memoryId) => {
    if (!user) return;

    try {
      // Record the practice session
      await submitFlashcardAnswer(memoryId, correct);

      // Update question of day streak
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching streak data:', error);
        return;
      }

      let newStreak = correct ? 1 : 0;
      let bestStreak = data?.question_of_day_best_streak || data?.question_of_day_streak || 0;

      if (data && data.last_qod_date && correct) {
        const lastDate = new Date(data.last_qod_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          newStreak = (data.question_of_day_streak || 0) + 1;
        } else if (daysDiff === 0) {
          newStreak = data.question_of_day_streak || 1;
        }
      }

      // Update best streak if current is higher
      if (newStreak > bestStreak) {
        bestStreak = newStreak;
      }

      const { error: updateError } = await supabase
        .from('streak_data')
        .upsert({
          user_id: user.id,
          question_of_day_streak: newStreak,
          question_of_day_best_streak: bestStreak,
          last_qod_date: today
        }, { onConflict: 'user_id' });

      if (updateError) {
        console.error('Error updating question of day streak:', updateError);
        return;
      }

      setStreaks(prev => ({
        ...prev,
        questionOfDay: {
          current: newStreak,
          best: bestStreak,
          lastDate: today
        }
      }));

    } catch (error) {
      console.error('Error in markTodaysQuestionAsAnswered:', error);
    }
  };

  const hasAnsweredTodaysQuestion = () => {
    // Check if user has answered today's question
    const today = new Date().toISOString().split('T')[0];
    return streaks.questionOfDay.lastDate === today;
  };

  const getDisplayName = (memory) => {
    return memory.type === 'birthday' ? `${memory.name}'s Birthday` : memory.name;
  };

  const getUpcomingDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return memories.map(memory => {
      const [month, day] = memory.date.split('/').map(Number);

      // Calculate days until next occurrence
      let daysUntil;
      const thisYear = new Date(today.getFullYear(), month - 1, day);
      const nextYear = new Date(today.getFullYear() + 1, month - 1, day);

      if (thisYear >= today) {
        daysUntil = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
      } else {
        daysUntil = Math.ceil((nextYear - today) / (1000 * 60 * 60 * 24));
      }

      return {
        ...memory,
        daysUntil,
        nextDate: thisYear >= today ? thisYear : nextYear
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const getMemoriesForQuiz = () => {
    // Return memories that need practice (low accuracy or haven't been practiced recently)
    return memories
      .filter(memory => {
        const totalAttempts = memory.correctCount + memory.incorrectCount;
        const accuracy = totalAttempts > 0 ? (memory.correctCount / totalAttempts) * 100 : 0;
        return totalAttempts === 0 || accuracy < 80;
      })
      .sort((a, b) => {
        const aTotal = a.correctCount + a.incorrectCount;
        const bTotal = b.correctCount + b.incorrectCount;
        const aAccuracy = aTotal > 0 ? (a.correctCount / aTotal) * 100 : 0;
        const bAccuracy = bTotal > 0 ? (b.correctCount / bTotal) * 100 : 0;
        return aAccuracy - bAccuracy;
      });
  };

  const retryLoadMemories = () => {
    loadMemories();
  };

  const value = {
    memories,
    loading,
    error,
    dataFetchAttempted,
    streaks,
    addMemory,
    updateMemory,
    deleteMemory,
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