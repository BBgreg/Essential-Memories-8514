import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { addDays, format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';

const MemoryContext = createContext();

export const MemoryProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [memories, setMemories] = useState([]);
  const [streakData, setStreakData] = useState({
    questionOfDay: { current: 0, best: 0 },
    flashcard: { current: 0, best: 0 },
    lastQotdDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  // Added flag to track if we've attempted data fetching
  const [retryCount, setRetryCount] = useState(0);

  // Function to format date from DB (month, day) to MM/DD format
  const formatDateFromDB = (month, day) => {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  };

  // Function to parse MM/DD format to {month, day}
  const parseDateToDb = (dateString) => {
    if (!dateString) return null;
    const [month, day] = dateString.split('/').map(Number);
    return { month, day };
  };

  // Convert DB date object to memory object for frontend
  const convertDbDateToMemory = (dbDate) => {
    return {
      id: dbDate.id,
      name: dbDate.name,
      displayName: dbDate.display_name,
      date: formatDateFromDB(dbDate.month, dbDate.day),
      type: dbDate.category,
      createdAt: dbDate.created_at,
      correctCount: 0, // Will be updated from practice sessions
      incorrectCount: 0, // Will be updated from practice sessions
      lastQuizzed: null, // Will be updated from practice sessions
      difficulty: 1 // Will be calculated based on practice sessions
    };
  };

  // Function to retry loading memories if there was an error
  const retryLoadMemories = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // Function to load memories and practice stats from Supabase
  const loadMemoriesAndStats = useCallback(async () => {
    // Only attempt to load data if we have a user and auth is not loading
    if (!user || authLoading) {
      console.log("Not loading memories - user not ready", { user, authLoading });
      return;
    }

    try {
      console.log("Starting to load memories for user:", user.id);
      setLoading(true);
      setDataFetchAttempted(true);

      // Fetch all dates for the current user
      const { data: datesData, error: datesError } = await supabase
        .from('dates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (datesError) {
        console.error("Error fetching dates:", datesError);
        throw datesError;
      }

      console.log(`Successfully fetched ${datesData?.length || 0} dates`);

      // Fetch all practice sessions for the current user
      const { data: practiceData, error: practiceError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (practiceError) {
        console.error("Error fetching practice sessions:", practiceError);
        throw practiceError;
      }

      console.log(`Successfully fetched ${practiceData?.length || 0} practice sessions`);

      // Fetch streak data for the current user
      const { data: streakData, error: streakError } = await supabase
        .from('streak_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        console.error("Error fetching streak data:", streakError);
        throw streakError;
      }

      console.log("Streak data fetch result:", streakData || "No streak data yet");

      // Process dates and practice sessions
      const processedMemories = (datesData || []).map(dbDate => {
        const memory = convertDbDateToMemory(dbDate);

        // Count correct and incorrect sessions for this date
        const dateSessionsCount = (practiceData || [])
          .filter(session => session.date_id === dbDate.id)
          .reduce((counts, session) => {
            if (session.correct) {
              counts.correct++;
            } else {
              counts.incorrect++;
            }
            return counts;
          }, { correct: 0, incorrect: 0 });

        // Get the last practice session for this date
        const dateSessions = (practiceData || [])
          .filter(session => session.date_id === dbDate.id)
          .sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));

        const lastSession = dateSessions.length > 0 ? dateSessions[0] : null;

        // Calculate difficulty based on success rate
        const totalAttempts = dateSessionsCount.correct + dateSessionsCount.incorrect;
        let difficulty = 1; // Default difficulty
        if (totalAttempts > 0) {
          const successRate = dateSessionsCount.correct / totalAttempts;
          difficulty = 3 - (successRate * 2); // Scale from 1 (100% correct) to 3 (0% correct)
        }

        // Update memory with practice stats
        return {
          ...memory,
          correctCount: dateSessionsCount.correct,
          incorrectCount: dateSessionsCount.incorrect,
          lastQuizzed: lastSession ? lastSession.attempted_at : null,
          difficulty
        };
      });

      setMemories(processedMemories);

      // Set streak data if it exists
      if (streakData) {
        setStreakData({
          questionOfDay: {
            current: streakData.qotd_current_streak,
            best: streakData.qotd_all_time_high
          },
          flashcard: {
            current: streakData.flashcard_current_streak,
            best: streakData.flashcard_all_time_high
          },
          lastQotdDate: streakData.last_qotd_date
        });
      } else if (user) {
        // Initialize streak data if it doesn't exist
        await initializeStreakData();
      }

      console.log("Successfully processed all data");
      setInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Error loading memories and stats:', err);
      setError(err.message || "Failed to load your memories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initialize streak data for a new user
  const initializeStreakData = async () => {
    try {
      console.log("Initializing streak data for user:", user.id);
      
      const { data, error } = await supabase
        .from('streak_data')
        .insert({
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error initializing streak data:", error);
        throw error;
      }

      console.log("Successfully initialized streak data:", data);
      
      setStreakData({
        questionOfDay: { current: 0, best: 0 },
        flashcard: { current: 0, best: 0 },
        lastQotdDate: null
      });
    } catch (err) {
      console.error('Error initializing streak data:', err);
    }
  };

  // Migration: Load data from localStorage and migrate to Supabase (one-time)
  const migrateLocalStorageToSupabase = useCallback(async () => {
    if (!user || authLoading || !initialized) return;

    try {
      // Check if we have data in localStorage
      const savedState = localStorage.getItem('memoryAppState');
      if (!savedState) return;

      const parsedState = JSON.parse(savedState);
      if (!parsedState.memories || parsedState.memories.length === 0) return;

      // Check if we already have data in Supabase for this user
      const { count, error: countError } = await supabase
        .from('dates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      // If we already have data in Supabase, don't migrate
      if (count > 0) return;

      // Migrate memories to Supabase
      const memoriesToInsert = parsedState.memories.map(memory => {
        const { month, day } = parseDateToDb(memory.date);
        return {
          user_id: user.id,
          name: memory.name,
          display_name: memory.type === 'birthday' ? `${memory.name}'s Birthday` : memory.name,
          month,
          day,
          category: memory.type
        };
      });

      // Insert memories into Supabase
      const { data: insertedDates, error: insertError } = await supabase
        .from('dates')
        .insert(memoriesToInsert)
        .select();

      if (insertError) throw insertError;

      // Migrate practice sessions
      const practiceSessions = [];
      for (let i = 0; i < insertedDates.length; i++) {
        const memory = parsedState.memories[i];
        const dateId = insertedDates[i].id;

        // Add correct count practice sessions
        for (let j = 0; j < memory.correctCount; j++) {
          practiceSessions.push({
            user_id: user.id,
            date_id: dateId,
            correct: true,
            session_type: 'Flashcard Drill',
            // Spread out the timestamps a bit to avoid conflicts
            attempted_at: new Date(Date.now() - j * 60000).toISOString()
          });
        }

        // Add incorrect count practice sessions
        for (let j = 0; j < memory.incorrectCount; j++) {
          practiceSessions.push({
            user_id: user.id,
            date_id: dateId,
            correct: false,
            session_type: 'Flashcard Drill',
            // Spread out the timestamps a bit to avoid conflicts
            attempted_at: new Date(Date.now() - (memory.correctCount + j) * 60000).toISOString()
          });
        }
      }

      // Insert practice sessions in batches if needed
      if (practiceSessions.length > 0) {
        const { error: practiceError } = await supabase
          .from('practice_sessions')
          .insert(practiceSessions);

        if (practiceError) throw practiceError;
      }

      // Migrate streak data
      const { error: streakError } = await supabase
        .from('streak_data')
        .update({
          qotd_current_streak: parsedState.streaks?.questionOfDay?.current || 0,
          qotd_all_time_high: parsedState.streaks?.questionOfDay?.best || 0,
          flashcard_current_streak: parsedState.streaks?.flashcard?.current || 0,
          flashcard_all_time_high: parsedState.streaks?.flashcard?.best || 0,
          last_qotd_date: parsedState.questionOfDay?.lastAnsweredDate
            ? new Date(parsedState.questionOfDay.lastAnsweredDate).toISOString().split('T')[0]
            : null
        })
        .eq('user_id', user.id);

      if (streakError) throw streakError;

      // Clear localStorage after successful migration
      localStorage.removeItem('memoryAppState');

      // Reload memories and stats
      await loadMemoriesAndStats();
    } catch (err) {
      console.error('Error migrating data from localStorage:', err);
    }
  }, [user, authLoading, initialized, loadMemoriesAndStats]);

  // Load memories and stats when auth state changes
  useEffect(() => {
    if (user && !authLoading) {
      console.log("Auth state changed, loading memories for user:", user.id);
      loadMemoriesAndStats();
    }
  }, [user, authLoading, loadMemoriesAndStats, retryCount]);

  // Migrate data from localStorage to Supabase
  useEffect(() => {
    if (user && !authLoading && initialized) {
      migrateLocalStorageToSupabase();
    }
  }, [user, authLoading, initialized, migrateLocalStorageToSupabase]);

  // Helper to get the display name based on memory type
  const getDisplayName = (memory) => {
    if (memory.type === 'birthday') {
      return `${memory.name}'s Birthday`;
    }
    return memory.name;
  };

  // Add a new memory
  const addMemory = async (memoryData) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Parse date to get month and day
      const { month, day } = parseDateToDb(memoryData.date);

      // Create display name
      const displayName = memoryData.type === 'birthday' ? `${memoryData.name}'s Birthday` : memoryData.name;

      // Insert date into Supabase
      const { data, error } = await supabase
        .from('dates')
        .insert({
          user_id: user.id,
          name: memoryData.name,
          display_name: displayName,
          month,
          day,
          category: memoryData.type
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new memory to state
      const newMemory = convertDbDateToMemory(data);
      setMemories(prev => [newMemory, ...prev]);

      return newMemory;
    } catch (err) {
      console.error('Error adding memory:', err);
      setError(err.message);
      return null;
    }
  };

  // Delete a memory
  const deleteMemory = async (id) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Delete date from Supabase (cascade will delete practice sessions)
      const { error } = await supabase
        .from('dates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove memory from state
      setMemories(prev => prev.filter(memory => memory.id !== id));
    } catch (err) {
      console.error('Error deleting memory:', err);
      setError(err.message);
    }
  };

  // Update a memory
  const updateMemory = async (updatedMemory) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Parse date to get month and day
      const { month, day } = parseDateToDb(updatedMemory.date);

      // Create display name
      const displayName = updatedMemory.type === 'birthday' ? `${updatedMemory.name}'s Birthday` : updatedMemory.name;

      // Update date in Supabase
      const { data, error } = await supabase
        .from('dates')
        .update({
          name: updatedMemory.name,
          display_name: displayName,
          month,
          day,
          category: updatedMemory.type
        })
        .eq('id', updatedMemory.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update memory in state
      const updatedDbMemory = convertDbDateToMemory(data);
      setMemories(prev => prev.map(memory => 
        memory.id === updatedMemory.id 
          ? {
              ...updatedDbMemory,
              correctCount: memory.correctCount,
              incorrectCount: memory.incorrectCount,
              lastQuizzed: memory.lastQuizzed,
              difficulty: memory.difficulty
            } 
          : memory
      ));
    } catch (err) {
      console.error('Error updating memory:', err);
      setError(err.message);
    }
  };

  // Record a flashcard answer
  const submitFlashcardAnswer = async (memoryId, correct) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Insert practice session into Supabase
      const { error: practiceError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          date_id: memoryId,
          correct,
          session_type: 'Flashcard Drill'
        });

      if (practiceError) throw practiceError;

      // Update memory stats in state
      setMemories(prev => prev.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            correctCount: memory.correctCount + (correct ? 1 : 0),
            incorrectCount: memory.incorrectCount + (correct ? 0 : 1),
            lastQuizzed: new Date().toISOString(),
            // Adjust difficulty based on performance
            difficulty: correct ? Math.max(1, memory.difficulty - 0.1) : Math.min(3, memory.difficulty + 0.3)
          };
        }
        return memory;
      }));

      // Update streak data
      let newStreakData = { ...streakData };
      if (correct) {
        newStreakData.flashcard.current += 1;
        if (newStreakData.flashcard.current > newStreakData.flashcard.best) {
          newStreakData.flashcard.best = newStreakData.flashcard.current;
        }
      } else {
        newStreakData.flashcard.current = 0;
      }

      setStreakData(newStreakData);

      // Update streak data in Supabase
      const { error: streakError } = await supabase
        .from('streak_data')
        .update({
          flashcard_current_streak: newStreakData.flashcard.current,
          flashcard_all_time_high: newStreakData.flashcard.best,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (streakError) throw streakError;
    } catch (err) {
      console.error('Error submitting flashcard answer:', err);
      setError(err.message);
    }
  };

  // Record a question of the day answer
  const markTodaysQuestionAsAnswered = async (correct, memoryId) => {
    try {
      if (!user) throw new Error('User not authenticated');

      if (!memoryId) {
        if (memories.length === 0) return;
        memoryId = memories[0].id;
      }

      // Insert practice session into Supabase
      const { error: practiceError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          date_id: memoryId,
          correct,
          session_type: 'Question of the Day'
        });

      if (practiceError) throw practiceError;

      // Update memory stats in state
      setMemories(prev => prev.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            correctCount: memory.correctCount + (correct ? 1 : 0),
            incorrectCount: memory.incorrectCount + (correct ? 0 : 1),
            lastQuizzed: new Date().toISOString(),
            // Adjust difficulty based on performance
            difficulty: correct ? Math.max(1, memory.difficulty - 0.1) : Math.min(3, memory.difficulty + 0.3)
          };
        }
        return memory;
      }));

      // Update streak data
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      let newStreakData = { ...streakData, lastQotdDate: today };
      if (correct) {
        newStreakData.questionOfDay.current += 1;
        if (newStreakData.questionOfDay.current > newStreakData.questionOfDay.best) {
          newStreakData.questionOfDay.best = newStreakData.questionOfDay.current;
        }
      } else {
        newStreakData.questionOfDay.current = 0;
      }

      setStreakData(newStreakData);

      // Update streak data in Supabase
      const { error: streakError } = await supabase
        .from('streak_data')
        .update({
          qotd_current_streak: newStreakData.questionOfDay.current,
          qotd_all_time_high: newStreakData.questionOfDay.best,
          last_qotd_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (streakError) throw streakError;
    } catch (err) {
      console.error('Error marking today\'s question as answered:', err);
      setError(err.message);
    }
  };

  // Get upcoming dates for the next 30 days
  const getUpcomingDates = () => {
    if (memories.length === 0) return [];

    const today = startOfToday();
    const nextThirtyDays = addDays(today, 30);

    return memories
      .map(memory => {
        // Parse the stored MM/DD date format
        const [month, day] = memory.date.split('/').map(Number);

        // Create a date object for this year
        const thisYearDate = new Date(new Date().getFullYear(), month - 1, day);

        // If the date has already passed this year, use next year
        const nextDate = isBefore(thisYearDate, today)
          ? new Date(new Date().getFullYear() + 1, month - 1, day)
          : thisYearDate;

        // Calculate days until
        const diffTime = nextDate.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...memory,
          displayName: getDisplayName(memory),
          nextDate,
          daysUntil
        };
      })
      .filter(memory => memory.daysUntil <= 30) // Only include dates within the next 30 days
      .sort((a, b) => a.daysUntil - b.daysUntil); // Sort by closest date first
  };

  // Get memories that should be quizzed based on difficulty and last quizzed date
  const getMemoriesForQuiz = () => {
    if (memories.length === 0) return [];

    const today = new Date();

    // Filter memories that should be quizzed
    return memories
      .filter(memory => {
        // If never quizzed, include it
        if (!memory.lastQuizzed) return true;

        const lastQuizzed = new Date(memory.lastQuizzed);
        const daysSinceLastQuizzed = Math.floor(
          (today - lastQuizzed) / (1000 * 60 * 60 * 24)
        );

        // Quiz more frequently for higher difficulty memories
        const quizInterval = Math.max(1, Math.floor(7 / memory.difficulty));
        return daysSinceLastQuizzed >= quizInterval;
      })
      .sort((a, b) => {
        // Prioritize never quizzed memories
        if (!a.lastQuizzed && b.lastQuizzed) return -1;
        if (a.lastQuizzed && !b.lastQuizzed) return 1;
        if (!a.lastQuizzed && !b.lastQuizzed) return b.difficulty - a.difficulty;

        // Then sort by difficulty and last quizzed date
        const lastQuizzedA = new Date(a.lastQuizzed);
        const lastQuizzedB = new Date(b.lastQuizzed);
        const daysSinceA = (today - lastQuizzedA) / (1000 * 60 * 60 * 24);
        const daysSinceB = (today - lastQuizzedB) / (1000 * 60 * 60 * 24);

        // Weighted score based on difficulty and days since last quizzed
        const scoreA = a.difficulty * daysSinceA;
        const scoreB = b.difficulty * daysSinceB;
        return scoreB - scoreA;
      });
  };

  // Check if today's question has been answered
  const hasAnsweredTodaysQuestion = () => {
    if (!streakData.lastQotdDate) return false;
    return streakData.lastQotdDate === new Date().toISOString().split('T')[0];
  };

  return (
    <MemoryContext.Provider
      value={{
        memories,
        streaks: {
          questionOfDay: streakData.questionOfDay,
          flashcard: streakData.flashcard
        },
        loading,
        error,
        dataFetchAttempted,
        retryLoadMemories,
        addMemory,
        deleteMemory,
        updateMemory,
        submitFlashcardAnswer,
        markTodaysQuestionAsAnswered,
        getUpcomingDates,
        getMemoriesForQuiz,
        getDisplayName,
        hasAnsweredTodaysQuestion
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => useContext(MemoryContext);