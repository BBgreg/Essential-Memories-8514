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
  const [streaks, setStreaks] = useState({
    current: 0,
    best: 0
  });

  // Fetch streaks when user logs in
  useEffect(() => {
    if (user) {
      fetchUserStreaks();
    }
  }, [user]);

  const fetchUserStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_streak, best_streak')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setStreaks({
          current: data.current_streak,
          best: data.best_streak
        });
      } else {
        // Create initial streak record if none exists
        await supabase
          .from('user_streaks')
          .insert([
            {
              user_id: user.id,
              current_streak: 0,
              best_streak: 0
            }
          ]);
      }
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };

  const updateStreak = async (isCorrect) => {
    try {
      let newCurrentStreak = isCorrect ? streaks.current + 1 : 0;
      let newBestStreak = Math.max(streaks.best, newCurrentStreak);

      const { error } = await supabase
        .from('user_streaks')
        .upsert({
          user_id: user.id,
          current_streak: newCurrentStreak,
          best_streak: newBestStreak,
          last_correct_date: new Date().toISOString()
        });

      if (error) throw error;

      setStreaks({
        current: newCurrentStreak,
        best: newBestStreak
      });

      return { current: newCurrentStreak, best: newBestStreak };
    } catch (error) {
      console.error('Error updating streak:', error);
      return streaks;
    }
  };

  // Add these to your existing context value
  const value = {
    // ... your existing context values ...
    streaks,
    updateStreak
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};