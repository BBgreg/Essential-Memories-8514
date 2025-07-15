import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Clear any auth errors
  const clearAuthError = () => {
    console.log('[AuthContext] Clearing auth error');
    setAuthError(null);
  };

  // Initialize auth state with robust error handling
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state...');
    
    let authListener = null;
    let timeoutId = null;
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.error('[AuthContext] FATAL ERROR: Supabase client not initialized');
          throw new Error("Supabase client not initialized due to config error.");
        }

        // Set up the auth state change listener
        const { data: listenerData } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthContext] Auth state change event:', event, 'Session exists:', !!session);
            
            if (!mounted) return;

            if (session) {
              console.log('[AuthContext] User authenticated:', session.user.id);
              setUser(session.user);
              // Load profile after user is set
              await loadUserProfile(session.user.id);
            } else {
              console.log('[AuthContext] User signed out or no session');
              setUser(null);
              setProfile(null);
            }
            
            // Always exit loading state after auth state change
            setLoading(false);
          }
        );
        authListener = listenerData;

        // CRITICAL: Initial session check with timeout
        console.log('[AuthContext] Performing initial session check...');
        
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error('[AuthContext] Authentication check timed out after 10 seconds');
            reject(new Error("Authentication check timed out after 10 seconds"));
          }, 10000);
        });

        const sessionResult = await Promise.race([
          getSessionPromise,
          timeoutPromise
        ]);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        const { data: { session }, error: getSessionError } = sessionResult;

        console.log('[AuthContext] Initial session check result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: getSessionError?.message
        });

        if (getSessionError) {
          console.error('[AuthContext] Session check error:', getSessionError);
          // Try refreshing session once on error
          const refreshed = await refreshSession();
          console.log('[AuthContext] Session refresh attempt result:', refreshed ? 'Success' : 'Failed');
          
          if (!refreshed) {
            throw getSessionError;
          }
          
          // If refresh succeeded, get the session again
          const { data: refreshData } = await supabase.auth.getSession();
          if (refreshData.session) {
            setUser(refreshData.session.user);
            await loadUserProfile(refreshData.session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        } else if (mounted) {
          if (session) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }

      } catch (error) {
        console.error('[AuthContext] Error during auth initialization:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAuthError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('[AuthContext] Auth initialization complete, loading set to false');
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      console.log('[AuthContext] Cleanup: Unsubscribing from auth listener');
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

  // Load user profile
  const loadUserProfile = async (userId) => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('[AuthContext] Profile not found, creating...');
          await createUserProfile(userId);
        } else {
          console.error('[AuthContext] Error loading profile:', error);
          throw error;
        }
      } else {
        console.log('[AuthContext] Profile loaded successfully');
        setProfile(data);
      }
    } catch (error) {
      console.error('[AuthContext] Error in loadUserProfile:', error);
      setProfile(null);
    }
  };

  // Create user profile
  const createUserProfile = async (userId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('No user data available');

      console.log('[AuthContext] Creating profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: userData.user.email,
            display_name: userData.user.user_metadata?.display_name || null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('[AuthContext] Error creating profile:', error);
        throw error;
      }

      console.log('[AuthContext] Profile created successfully');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('[AuthContext] Error in createUserProfile:', error);
      throw error;
    }
  };

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
        setAuthError(error.message);
        return null;
      }

      console.log('[AuthContext] Signup successful:', data.user ? 'User created' : 'Confirmation email sent');
      return data;
    } catch (error) {
      console.error('[AuthContext] Unexpected signup error:', error.message);
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
        setAuthError(error.message);
        return null;
      }

      console.log('[AuthContext] Sign in successful, user ID:', data.user.id);
      return data;
    } catch (error) {
      console.error('[AuthContext] Unexpected sign in error:', error.message);
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
        setAuthError(error.message);
      } else {
        console.log('[AuthContext] Sign out successful');
        // Force navigation to login page after sign out
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('[AuthContext] Unexpected sign out error:', error.message);
      setAuthError(error.message || 'An unexpected error occurred during sign out');
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`
      });

      if (error) {
        console.error('[AuthContext] Password reset error:', error.message);
        setAuthError(error.message);
        return false;
      }

      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Unexpected password reset error:', error.message);
      setAuthError(error.message || 'An unexpected error occurred during password reset');
      return false;
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      clearAuthError();
      console.log('[AuthContext] Updating password');

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error('[AuthContext] Password update error:', error.message);
        setAuthError(error.message);
        return false;
      }

      console.log('[AuthContext] Password updated successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Unexpected password update error:', error.message);
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
        throw error;
      }

      console.log('[AuthContext] Profile updated successfully');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('[AuthContext] Profile update error:', error.message);
      setAuthError(error.message);
      return null;
    }
  };

  // Log current auth state for debugging
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