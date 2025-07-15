import React, { createContext, useContext, useState } from 'react';

// Mock auth context with no actual backend integration
const AuthContext = createContext({
  user: null,
  loading: false,
  authError: null,
  clearAuthError: () => {},
  signUp: () => {},
  signIn: () => {},
  signOut: () => {},
  resetPassword: () => {},
  updatePassword: () => {},
  updateProfile: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Mock auth state with no backend
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Mock auth functions that don't connect to any backend
  const signUp = (email, password, metadata = {}) => {
    console.log('Mock signup called with:', { email, metadata });
    // This function now does nothing
    return { user: null };
  };

  const signIn = (email, password) => {
    console.log('Mock login called with:', { email });
    // This function now does nothing
    return { user: null };
  };

  const signOut = () => {
    console.log('Mock signout called');
    // This function now does nothing
  };

  const resetPassword = (email) => {
    console.log('Mock reset password called for:', email);
    // This function now does nothing
    return true;
  };

  const updatePassword = (password) => {
    console.log('Mock update password called');
    // This function now does nothing
    return true;
  };

  const updateProfile = (updates) => {
    console.log('Mock update profile called with:', updates);
    // This function now does nothing
    return null;
  };

  const value = {
    user,
    profile: null,
    loading,
    authError,
    clearAuthError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;