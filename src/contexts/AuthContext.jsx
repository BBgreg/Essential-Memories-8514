import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Clear any auth errors
  const clearAuthError = () => setAuthError(null);

  // Load user profile from the profiles table
  const loadUserProfile = async (userId) => {
    try {
      console.log("Loading profile for user:", userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log("No profile found, will create one");
        } else {
          console.error("Error loading profile:", error);
          throw error;
        }
      }

      if (profile) {
        console.log("Profile loaded successfully");
        setProfile(profile);
      } else if (user?.email) {
        console.log("Creating new profile");
        await createUserProfile(userId, user.email);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Create a new user profile
  const createUserProfile = async (userId, email, displayName = null) => {
    try {
      console.log("Creating profile for user:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          display_name: displayName || email.split('@')[0]
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        throw error;
      }

      console.log("Profile created successfully");
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  // Initialize auth state and set up listeners
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        setLoading(true);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          error: error?.message
        });

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            console.log('Setting authenticated user:', session.user.id);
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            console.log('No authenticated user found');
            setUser(null);
          }
          setSessionChecked(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user && mounted) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('User not authenticated');

      console.log("Updating profile for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      console.log("Profile updated successfully");
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      clearAuthError();
      setLoading(true);

      console.log("Signing up new user with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error("Signup error:", error);
        throw error;
      }

      console.log("Signup successful:", data.user?.id);
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
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

      console.log("Signing in user with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Signin error:", error);
        throw error;
      }

      console.log("Signin successful:", data.user?.id);
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      clearAuthError();
      setLoading(true);

      console.log("Sending password reset email to:", email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/update-password'
      });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      console.log("Password reset email sent successfully");
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
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

      console.log("Updating password for user");
      
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        console.error("Update password error:", error);
        throw error;
      }

      console.log("Password updated successfully");
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      setAuthError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      clearAuthError();
      setLoading(true);

      console.log("Signing out user");
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Signout error:", error);
        throw error;
      }
      
      console.log("Signout successful");
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
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
}

export function useAuth() {
  return useContext(AuthContext);
}