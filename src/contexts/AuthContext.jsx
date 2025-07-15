import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateProfile: async () => {}
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthError(error.message);
        } else if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        setAuthError('Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: metadata.displayName || ''
          }
        }
      });

      if (error) {
        setAuthError(error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('An unexpected error occurred during signup');
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('An unexpected error occurred during login');
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setAuthError(error.message);
        return false;
      }

      setUser(null);
      setProfile(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('An unexpected error occurred during logout');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) {
        setAuthError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthError('An unexpected error occurred during password reset');
      return false;
    }
  };

  const updatePassword = async (password) => {
    try {
      setAuthError(null);
      
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        setAuthError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password update error:', error);
      setAuthError('An unexpected error occurred during password update');
      return false;
    }
  };

  const updateProfile = async (updates) => {
    try {
      setAuthError(null);
      
      if (!user) {
        setAuthError('No user logged in');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setAuthError(error.message);
        return null;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      setAuthError('An unexpected error occurred during profile update');
      return null;
    }
  };

  const value = {
    user,
    profile,
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