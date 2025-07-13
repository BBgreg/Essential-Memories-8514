import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

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
  const [authInitialized, setAuthInitialized] = useState(false);

  // Clear any auth errors
  const clearAuthError = () => setAuthError(null);

  // Load user profile from the profiles table
  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user:', userId.substring(0, 8) + '...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error);
        throw error;
      }
      
      if (profile) {
        console.log('Profile loaded successfully');
        setProfile(profile);
      } else {
        console.log('No profile found for user');
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider initializing...');

    const initializeAuth = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
          throw error;
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('Initial session found for user:', session.user.id.substring(0, 8) + '...');
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            console.log('No initial session found');
          }
          // Important: Set loading to false AFTER processing the initial session
          setLoading(false);
          setAuthInitialized(true);
          console.log('Auth initialization complete');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
        if (mounted) {
          // Important: Set loading to false even if there was an error
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        console.log('Session user ID:', session?.user?.id ? (session.user.id.substring(0, 8) + '...') : 'No user');
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          
          // Important: Set loading to false after processing auth state changes
          // but only if this is the INITIAL_SESSION event or we've already initialized
          if (event === 'INITIAL_SESSION' || authInitialized) {
            setLoading(false);
            setAuthInitialized(true);
            console.log('Auth state updated, loading set to false');
          }
        }
      }
    );

    initializeAuth();

    // Add a safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Safety timeout triggered - forcing loading to false');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 10000); // 10 seconds safety timeout

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      clearAuthError();
      setLoading(true);
      console.log('Signing up user with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/#/login`
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      console.log('Signup successful');
      return data;
    } catch (error) {
      setAuthError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      clearAuthError();
      setLoading(true);
      console.log('Signing in user with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful');
      return data;
    } catch (error) {
      setAuthError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      clearAuthError();
      setLoading(true);
      console.log('Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email) => {
    try {
      clearAuthError();
      setLoading(true);
      console.log('Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`
      });
      
      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      console.log('Password reset email sent successfully');
      return true;
    } catch (error) {
      setAuthError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      clearAuthError();
      setLoading(true);
      console.log('Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      return true;
    } catch (error) {
      setAuthError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        console.error('Cannot update profile: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      console.log('Updating profile for user:', user.id.substring(0, 8) + '...');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      console.log('Profile updated successfully');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  // Log the current auth state for debugging
  console.log('Auth context state:', {
    userExists: !!user,
    profileExists: !!profile,
    loading,
    hasError: !!authError,
    authInitialized
  });

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