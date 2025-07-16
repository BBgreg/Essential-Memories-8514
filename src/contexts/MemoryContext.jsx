import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const MemoryContext = createContext({});

// Export the useMemory hook
export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

// Export the MemoryProvider component
export const MemoryProvider = ({ children }) => {
  // ... rest of the provider implementation remains the same ...
};

// Remove this line as we're using named exports above
// export default MemoryProvider;