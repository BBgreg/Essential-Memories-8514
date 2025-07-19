import React, { createContext, useContext, useState, useEffect } from 'react';

// Add global error handling
window.onerror = (message, source, lineno, colno, error) => {
  console.error("DEBUG: Uncaught Global Error:", { message, source, lineno, colno, error });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error("DEBUG: Unhandled Promise Rejection:", event.reason);
});

console.log("DEBUG: AuthContext - Module loading started");

// Import Supabase directly (no top-level await)
import { supabase } from '../lib/supabase';

console.log("DEBUG: AuthContext - Supabase imported successfully:", !!supabase);

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
  console.log("DEBUG: AuthContext - useAuth hook called");
  const context = useContext(AuthContext);
  if (!context) {
    console.error("DEBUG: AuthContext - useAuth must be used within an AuthProvider");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log("DEBUG: AuthContext - AuthProvider initializing");
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  console.log("DEBUG: AuthContext - Initial state set", { loading, user: !!user, profile: !!profile });

  useEffect(() => {
    console.log("DEBUG: AuthContext - Main useEffect starting");
    
    const checkSession = async () => {
      try {
        console.log("DEBUG: AuthContext - Checking session");
        setLoading(true);
        
        if (!supabase || !supabase.auth) {
          console.error("DEBUG: AuthContext - Supabase not properly initialized");
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("DEBUG: AuthContext - Session check error:", error);
          setLoading(false);
          return;
        }

        console.log("DEBUG: AuthContext - Session check result:", { hasSession: !!session, userId: session?.user?.id });

        if (session) {
          setUser(session.user);
          
          if (session.user) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (!profileError && profileData) {
                console.log("DEBUG: AuthContext - Profile loaded successfully");
                setProfile(profileData);
              } else if (profileError && profileError.code !== 'PGRST116') {
                console.error('DEBUG: AuthContext - Error fetching profile:', profileError);
              }
            } catch (profileErr) {
              console.error('DEBUG: AuthContext - Profile fetch exception:', profileErr);
            }
          }
        }
        
        setLoading(false);
        console.log("DEBUG: AuthContext - Session check completed");
        
      } catch (error) {
        console.error('DEBUG: AuthContext - Session check failed:', error);
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    let subscription;
    try {
      console.log("DEBUG: AuthContext - Setting up auth state listener");
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("DEBUG: AuthContext - Auth state changed:", event, { hasSession: !!session });
          
          if (session) {
            setUser(session.user);
            
            if (session.user) {
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (!profileError && profileData) {
                  setProfile(profileData);
                } else if (profileError && profileError.code === 'PGRST116') {
                  const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      username: session.user.user_metadata?.display_name || null
                    })
                    .select()
                    .single();

                  if (!createError && newProfile) {
                    setProfile(newProfile);
                  } else {
                    console.error('DEBUG: AuthContext - Error creating profile:', createError);
                  }
                } else {
                  console.error('DEBUG: AuthContext - Error fetching profile:', profileError);
                }
              } catch (profileErr) {
                console.error('DEBUG: AuthContext - Profile handling exception:', profileErr);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      );
      
      subscription = authSubscription;
      console.log("DEBUG: AuthContext - Auth listener set up successfully");
      
    } catch (error) {
      console.error('DEBUG: AuthContext - Failed to set up auth listener:', error);
    }

    return () => {
      console.log("DEBUG: AuthContext - Cleaning up auth listener");
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    console.log("DEBUG: AuthContext - signIn called with email:", email);
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("DEBUG: AuthContext - signIn error:", error);
        setAuthError(error.message);
        return { user: null, error: error.message };
      }

      console.log("DEBUG: AuthContext - signIn successful");
      return { user: data.user, error: null };
    } catch (error) {
      console.error("DEBUG: AuthContext - signIn exception:", error);
      setAuthError(error.message);
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    console.log("DEBUG: AuthContext - signUp called with email:", email);
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
        console.error("DEBUG: AuthContext - signUp error:", error);
        setAuthError(error.message);
        return { user: null, error: error.message };
      }

      console.log("DEBUG: AuthContext - signUp successful");
      return { user: data.user, error: null };
    } catch (error) {
      console.error("DEBUG: AuthContext - signUp exception:", error);
      setAuthError(error.message);
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    console.log("DEBUG: AuthContext - signOut called");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('DEBUG: AuthContext - Sign out error:', error);
        return false;
      }
      console.log("DEBUG: AuthContext - signOut successful");
      return true;
    } catch (error) {
      console.error('DEBUG: AuthContext - Sign out exception:', error);
      return false;
    }
  };

  const resetPassword = async (email) => {
    console.log("DEBUG: AuthContext - resetPassword called with email:", email);
    try {
      setAuthError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) {
        console.error("DEBUG: AuthContext - resetPassword error:", error);
        setAuthError(error.message);
        return false;
      }

      console.log("DEBUG: AuthContext - resetPassword successful");
      return true;
    } catch (error) {
      console.error("DEBUG: AuthContext - resetPassword exception:", error);
      setAuthError(error.message);
      return false;
    }
  };

  const updatePassword = async (password) => {
    console.log("DEBUG: AuthContext - updatePassword called");
    try {
      setAuthError(null);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("DEBUG: AuthContext - updatePassword error:", error);
        setAuthError(error.message);
        return false;
      }

      console.log("DEBUG: AuthContext - updatePassword successful");
      return true;
    } catch (error) {
      console.error("DEBUG: AuthContext - updatePassword exception:", error);
      setAuthError(error.message);
      return false;
    }
  };

  const clearAuthError = () => {
    console.log("DEBUG: AuthContext - clearAuthError called");
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

  console.log("DEBUG: AuthContext - Provider rendering with value:", {
    hasUser: !!user,
    hasProfile: !!profile,
    loading,
    hasAuthError: !!authError
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

console.log("DEBUG: AuthContext - Module loaded successfully");
export default AuthProvider;