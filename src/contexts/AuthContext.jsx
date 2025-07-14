import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase, { refreshSession } from '../lib/supabase';

// Create auth context with default values
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

  // Refs to track initialization and prevent race conditions
  const isInitialized = useRef(false);
  const loadingTimeoutId = useRef(null);
  const sessionCheckAttempted = useRef(false);

  // Clear any auth errors
  const clearAuthError = () => {
    console.log('[AuthContext] Clearing auth error');
    setAuthError(null);
  };

  // CRITICAL: Force exit from loading state after a maximum timeout
  // This prevents the app from being stuck in a loading state forever
  useEffect(() => {
    // Set a hard timeout to exit loading state after 5 seconds
    loadingTimeoutId.current = setTimeout(() => {
      if (loading) {
        console.warn('[AuthContext] FORCE EXIT from loading state after timeout');
        setLoading(false);
      }
    }, 5000);

    return () => {
      if (loadingTimeoutId.current) {
        clearTimeout(loadingTimeoutId.current);
      }
    };
  }, [loading]);

  // Initialize auth state
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state...');
    let mounted = true;

    // CRITICAL: Directly check the session first
    const checkInitialSession = async () => {
      if (sessionCheckAttempted.current) return;
      sessionCheckAttempted.current = true;

      try {
        console.log('[AuthContext] Performing initial session check...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Initial session check error:', error.message);
          console.error('[AuthContext] Full error details:', error);
          
          if (mounted) {
            setAuthError('Authentication session error. Please try logging out and back in.');
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (data.session) {
          console.log('[AuthContext] Initial session found for user:', data.session.user.id);
          console.log('[AuthContext] Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
          
          if (mounted) {
            setUser(data.session.user);
          }
        } else {
          console.log('[AuthContext] No initial session found');
          
          if (mounted) {
            setUser(null);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Unexpected error during initial session check:', error.message);
        console.error('[AuthContext] Full error:', error);
        
        if (mounted) {
          setAuthError('Authentication check failed. Please try again.');
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Start the initial session check immediately
    checkInitialSession();

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change event:', event, 'Session exists:', !!session);
        
        if (!mounted) return;

        if (session) {
          console.log('[AuthContext] User authenticated:', session.user.id);
          console.log('[AuthContext] Session expires at:', new Date(session.expires_at * 1000).toLocaleString());
          setUser(session.user);
          // We'll load profile separately to avoid blocking auth state update
        } else {
          console.log('[AuthContext] User signed out or no session');
          setUser(null);
          setProfile(null);
        }

        // CRITICAL: Always exit loading state after auth state change
        setLoading(false);
      }
    );

    // Clean up on unmount
    return () => {
      mounted = false;
      subscription?.unsubscribe();
      if (loadingTimeoutId.current) {
        clearTimeout(loadingTimeoutId.current);
      }
    };
  }, []);

  // Load user profile when user changes
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        console.log('[AuthContext] Loading profile for user:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[AuthContext] Error loading profile:', error.message);
          console.error('[AuthContext] Full error:', error);
          return;
        }

        if (data) {
          console.log('[AuthContext] Profile loaded successfully');
          setProfile(data);
        } else {
          console.log('[AuthContext] Profile not found, creating one...');
          
          // Create profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id, 
                email: user.email,
                created_at: new Date().toISOString() 
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('[AuthContext] Error creating profile:', createError.message);
            console.error('[AuthContext] Full error:', createError);
          } else if (newProfile) {
            console.log('[AuthContext] Profile created successfully');
            setProfile(newProfile);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Unexpected error loading profile:', error.message);
        console.error('[AuthContext] Full error:', error);
      }
    };

    loadProfile();
  }, [user]);

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Signing up user with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/#/login`
        }
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error.message);
        console.error('[AuthContext] Full error:', error);
        setAuthError(error.message);
        return null;
      }

      console.log('[AuthContext] Signup successful:', data.user ? 'User created' : 'Confirmation email sent');
      return data;
    } catch (error) {
      console.error('[AuthContext] Unexpected signup error:', error.message);
      console.error('[AuthContext] Full error:', error);
      setAuthError(error.message || 'An unexpected error occurred during signup');
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Signing in user with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error.message);
        console.error('[AuthContext] Full error details:', error);
        setAuthError(error.message);
        return null;
      }

      console.log('[AuthContext] Sign in successful, user ID:', data.user.id);
      
      // Verify the session was created
      const sessionCheck = await supabase.auth.getSession();
      console.log('[AuthContext] Post-login session check:', 
                  sessionCheck.data.session ? 'Session exists' : 'No session');
      
      return data;
    } catch (error) {
      console.error('[AuthContext] Unexpected sign in error:', error.message);
      console.error('[AuthContext] Full error:', error);
      setAuthError(error.message || 'An unexpected error occurred during sign in');
      return null;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      clearAuthError();
      console.log('[AuthContext] Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error.message);
        console.error('[AuthContext] Full error:', error);
        setAuthError(error.message);
      } else {
        console.log('[AuthContext] Sign out successful');
        // Auth state change listener will update user state
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected sign out error:', error.message);
      console.error('[AuthContext] Full error:', error);
      setAuthError(error.message || 'An unexpected error occurred during sign out');
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`
      });
      
      if (error) {
        console.error('[AuthContext] Password reset error:', error.message);
        console.error('[AuthContext] Full error:', error);
        setAuthError(error.message);
        return false;
      }
      
      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Unexpected password reset error:', error.message);
      console.error('[AuthContext] Full error:', error);
      setAuthError(error.message || 'An unexpected error occurred during password reset');
      return false;
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.error('[AuthContext] Password update error:', error.message);
        console.error('[AuthContext] Full error:', error);
        setAuthError(error.message);
        return false;
      }
      
      console.log('[AuthContext] Password updated successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Unexpected password update error:', error.message);
      console.error('[AuthContext] Full error:', error);
      setAuthError(error.message || 'An unexpected error occurred during password update');
      return false;
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        console.error('[AuthContext] Cannot update profile: No authenticated user');
        throw new Error('You must be logged in to update your profile');
      }
      
      console.log('[AuthContext] Updating profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('[AuthContext] Profile update error:', error.message);
        console.error('[AuthContext] Full error:', error);
        throw error;
      }
      
      console.log('[AuthContext] Profile updated successfully');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('[AuthContext] Profile update error:', error.message);
      console.error('[AuthContext] Full error:', error);
      return null;
    }
  };

  // Log the current auth state for debugging
  console.log('[AuthContext] Current state:', {
    user: user ? `${user.id.substring(0, 8)}...` : 'null',
    loading,
    hasError: !!authError,
    profile: profile ? 'loaded' : 'null'
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