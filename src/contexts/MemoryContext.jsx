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

  // Verify user authentication and profile existence
  const verifyUserProfile = async () => {
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile verification failed:', profileError);
      throw new Error('User profile not found. Please try logging out and back in.');
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
      
      // Verify user authentication and profile
      const userId = await verifyUserProfile();
      
      // Parse date
      const { month, day } = parseDateToDb(memoryData.date);
      
      // Prepare memory data
      const memoryToInsert = {
        user_id: userId,
        name: memoryData.name.trim(),
        display_name: memoryData.type === 'birthday' 
          ? `${memoryData.name.trim()}'s Birthday` 
          : memoryData.name.trim(),
        month,
        day,
        category: memoryData.type
      };

      console.log('Attempting to insert memory:', {
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
        throw new Error(insertError.message);
      }

      // Update local state
      const newMemory = {
        ...data,
        date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
      };

      setMemories(prev => [newMemory, ...prev]);
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

      if (!user?.id) {
        throw new Error('No authenticated user found');
      }

      const { data, error: fetchError } = await supabase
        .from('dates')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Format dates for display
      const formattedMemories = data.map(memory => ({
        ...memory,
        date: `${String(memory.month).padStart(2, '0')}/${String(memory.day).padStart(2, '0')}`
      }));

      setMemories(formattedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setDataFetchAttempted(true);
    }
  };

  // Reload memories when user changes
  useEffect(() => {
    if (user?.id) {
      loadMemories();
    } else {
      setMemories([]);
      setLoading(false);
      setDataFetchAttempted(true);
    }
  }, [user]);

  const value = {
    memories,
    loading,
    error,
    dataFetchAttempted,
    addMemory,
    // ... other memory-related functions
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export default MemoryProvider;