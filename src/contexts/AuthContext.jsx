import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  signIn: () => {},
  signUp: () => {},
  signOut: () => {},
  resetPassword: () => {},
  updatePassword: () => {},
  clearAuthError: () => {}
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

  // Initialize session and set up listener
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session) {
          setUser(session.user);
          
          // Get user profile data if logged in
          if (session.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!profileError && profileData) {
              setProfile(profileData);
            } else if (profileError && profileError.code !== 'PGRST116') {
              // PGRST116 is "No rows returned" error, which is expected for new users
              console.error('Error fetching profile:', profileError);
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
      }
    };

    // Initial session check
    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          setUser(session.user);
          
          // Get/create user profile
          if (session.user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!profileError && profileData) {
              setProfile(profileData);
            } else if (profileError && profileError.code === 'PGRST116') {
              // No profile found, the trigger should have created one
              // Let's wait a bit and try again
              setTimeout(async () => {
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (retryProfile) {
                  setProfile(retryProfile);
                }
              }, 1000);
            } else {
              console.error('Error fetching profile:', profileError);
            }
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // Cleanup subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      setAuthError(error.message);
      return { user: null, error: error.message };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        setAuthError(error.message);
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };
    } catch (error) {
      setAuthError(error.message);
      return { user: null, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  };

  // Reset password (send reset email)
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
      setAuthError(error.message);
      return false;
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setAuthError(error.message);
        return false;
      }

      return true;
    } catch (error) {
      setAuthError(error.message);
      return false;
    }
  };

  // Clear authentication errors
  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    profile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;