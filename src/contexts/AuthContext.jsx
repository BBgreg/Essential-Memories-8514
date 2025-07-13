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
      console.log('[AuthContext] Setting loading to FALSE');
      setLoading(false);
      loadingSetToFalse.current = true;
    }
  };

  // Clear any auth errors
  const clearAuthError = () => {
    console.log('[AuthContext] Clearing auth error');
    setAuthError(null);
  };

  // Load user profile from the profiles table
  const loadUserProfile = async (userId) => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AuthContext] Error loading profile:', error);
        return null;
      }
      
      if (profile) {
        console.log('[AuthContext] Profile loaded successfully:', profile);
        setProfile(profile);
        return profile;
      } else {
        console.log('[AuthContext] No profile found, creating one...');
        
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: user.email,
              display_name: user.user_metadata?.display_name || null,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
          
        if (createError) {
          console.error('[AuthContext] Error creating profile:', createError);
          return null;
        }
        
        console.log('[AuthContext] New profile created:', newProfile);
        setProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('[AuthContext] Error in loadUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('[AuthContext] Initializing AuthProvider...');
    
    // Force loading state to false after 8 seconds no matter what
    // This is a safety mechanism to prevent permanent loading state
    const hardTimeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[AuthContext] HARD TIMEOUT: Forcing auth loading state to false after 8s');
        safeSetLoadingFalse();
        if (!authInitialized) {
          setAuthInitialized(true);
        }
      }
    }, 8000);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change event:', event, 'Session exists:', !!session);
        
        if (mounted) {
          if (session?.user) {
            console.log('[AuthContext] User found in session:', session.user.id);
            setUser(session.user);
            
            // Load profile in the background but don't wait for it
            loadUserProfile(session.user.id).catch(err => {
              console.error('[AuthContext] Profile load failed but continuing:', err);
            });
          } else {
            console.log('[AuthContext] No user in session');
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
        console.log('[AuthContext] Getting initial session directly...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Direct session retrieval error:', error);
          if (mounted) {
            setAuthError('Failed to check authentication status');
            safeSetLoadingFalse();
            setAuthInitialized(true);
          }
          return;
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('[AuthContext] Initial direct session found for user:', session.user.id);
            setUser(session.user);
            
            // Load profile but don't wait for it
            loadUserProfile(session.user.id).catch(err => {
              console.error('[AuthContext] Initial profile load failed but continuing:', err);
            });
          } else {
            console.log('[AuthContext] No initial direct session found');
            setUser(null);
          }
          
          // Always initialize and stop loading after direct session check
          setAuthInitialized(true);
          safeSetLoadingFalse();
        }
      } catch (error) {
        console.error('[AuthContext] Error in direct session check:', error);
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
        console.warn('[AuthContext] Safety timeout triggered after 5s - forcing loading to false');
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
  const signUp = async (email, password, metadata = {}) => {
    try {
      clearAuthError();
      setLoading(true);
      loadingSetToFalse.current = false;
      
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
        console.error('[AuthContext] Signup error:', error);
        setAuthError(error.message);
        return null;
      }
      
      console.log('[AuthContext] Signup successful');
      return data;
    } catch (error) {
      console.error('[AuthContext] Signup error caught:', error);
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
      
      console.log('[AuthContext] Signing in user with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        setAuthError(error.message);
        return null;
      }
      
      console.log('[AuthContext] Sign in successful, user:', data?.user?.id);
      
      // Explicitly verify the session was created
      const sessionCheck = await supabase.auth.getSession();
      console.log('[AuthContext] Post-login session check:', !!sessionCheck.data.session);
      
      return data;
    } catch (error) {
      console.error('[AuthContext] Sign in error caught:', error);
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
      
      console.log('[AuthContext] Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        setAuthError(error.message);
      } else {
        console.log('[AuthContext] Sign out successful');
      }
    } catch (error) {
      console.error('[AuthContext] Sign out error caught:', error);
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
      
      console.log('[AuthContext] Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`
      });
      
      if (error) {
        console.error('[AuthContext] Password reset error:', error);
        setAuthError(error.message);
        return false;
      }
      
      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Password reset error caught:', error);
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
      
      console.log('[AuthContext] Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.error('[AuthContext] Password update error:', error);
        setAuthError(error.message);
        return false;
      }
      
      console.log('[AuthContext] Password updated successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Password update error caught:', error);
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
        console.error('[AuthContext] Cannot update profile: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      console.log('[AuthContext] Updating profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('[AuthContext] Profile update error:', error);
        throw error;
      }
      
      console.log('[AuthContext] Profile updated successfully');
      setProfile(data);
      return data;
    } catch (error) {
      console.error('[AuthContext] Error updating profile:', error);
      return null;
    }
  };

  // Log the current auth state for debugging
  console.log('[AuthContext] Auth context state:', { 
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