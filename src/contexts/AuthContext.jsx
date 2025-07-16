import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({
  user: null,
  loading: false,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  resetPassword: () => {},
  updatePassword: () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const signIn = async (email, password) => {
    console.log('Sign in attempted:', { email });
    // Simulate successful login
    setUser({ email, id: '1' });
    return { user: { email }, error: null };
  };

  const signUp = async (email, password) => {
    console.log('Sign up attempted:', { email });
    setUser({ email, id: '1' });
    return { user: { email }, error: null };
  };

  const signOut = async () => {
    setUser(null);
    return true;
  };

  const resetPassword = async (email) => {
    console.log('Password reset attempted:', { email });
    return true;
  };

  const updatePassword = async (password) => {
    console.log('Password update attempted');
    return true;
  };

  const value = {
    user,
    loading: false,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;