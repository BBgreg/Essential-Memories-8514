import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  
  // Use a ref to track if we've already set loading to false
  // This prevents race conditions when multiple auth events fire
  const loadingSetToFalse = useRef(false);

  // Safe way to set loading to false only once
  const safeSetLoadingFalse = () => {
    if (!loadingSetToFalse.current) {
      console.log('Setting loading to FALSE');
      setLoading(false);
      loadingSetToFalse.current = true;
    }
  };

  // Clear any auth errors
  const clearAuthError = () => setAuthError(null);

  // Load user profile from the profiles table
  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }
      
      if (profile) {
        console.log('Profile loaded successfully');
        setProfile(profile);
        return profile;
      } else {
        console.log('No profile found for user');
        return null;
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider initializing...');

    // Force loading state to false after 8 seconds no matter what
    // This is a safety mechanism to prevent permanent loading state
    const hardTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('HARD TIMEOUT: Forcing auth loading state to false after 8s');
        safeSetLoadingFalse();
        if (!authInitialized) {
          setAuthInitialized(true);
        }
      }
    }, 8000);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session exists:', !!session);
        
        if (mounted) {
          if (session?.user) {
            console.log('User found in session:', session.user.id);
            setUser(session.user);
            
            // Load profile in the background but don't wait for it
            loadUserProfile(session.user.id).catch(err => {
              console.error('Profile load failed but continuing:', err);
            });
          } else {
            console.log('No user in session');
            setUser(null);
            setProfile(null);
          }
          
          // Any auth event means we're initialized
          if (!authInitialized) {
            setAuthInitialized(true);
          }
          
          // IMPORTANT: Set loading to false after receiving any auth event
          // This ensures we don't get stuck in loading state
          safeSetLoadingFalse();
        }
      }
    );

    // Get the initial session directly - this is crucial as a backup
    // in case the onAuthStateChange event doesn't fire properly
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session directly...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Direct session retrieval error:', error);
          if (mounted) {
            setAuthError('Failed to check authentication status');
            safeSetLoadingFalse();
            setAuthInitialized(true);
          }
          return;
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('Initial direct session found for user:', session.user.id);
            setUser(session.user);
            
            // Load profile but don't wait for it
            loadUserProfile(session.user.id).catch(err => {
              console.error('Initial profile load failed but continuing:', err);
            });
          } else {
            console.log('No initial direct session found');
            setUser(null);
          }
          
          // Always initialize and stop loading after direct session check
          setAuthInitialized(true);
          safeSetLoadingFalse();
        }
      } catch (error) {
        console.error('Error in direct session check:', error);
        if (mounted) {
          setAuthError('Authentication check failed');
          safeSetLoadingFalse();
          setAuthInitialized(true);
        }
      }
    };
    
    // Execute the initial session check
    getInitialSession();

    // Add a shorter safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Safety timeout triggered after 5s - forcing loading to false');
        safeSetLoadingFalse();
        if (!authInitialized) {
          setAuthInitialized(true);
        }
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
      clearTimeout(hardTimeoutId);
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
      loadingSetToFalse.current = false;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
      loadingSetToFalse.current = false;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
      loadingSetToFalse.current = false;
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email) => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
      loadingSetToFalse.current = false;
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
      loadingSetToFalse.current = false;
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        console.error('Cannot update profile: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      console.log('Updating profile for user:', user.id);
      
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
    authInitialized,
    loadingSetToFalse: loadingSetToFalse.current
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