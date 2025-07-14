// CRITICAL: Core Supabase client configuration with robust error handling
import { createClient } from '@supabase/supabase-js';

// Function to safely get environment variables with fallbacks
const getEnvVar = (name) => {
  const value = process.env[`NEXT_PUBLIC_${name}`] ||
                process.env[`REACT_APP_${name}`] ||
                process.env[`VITE_APP_${name}`] ||
                process.env[name];
  
  // Hardcoded fallbacks for known project values if env vars are missing
  if (!value) {
    if (name === 'SUPABASE_URL') {
      return 'https://shtdwlskoalumikaqbtg.supabase.co';
    }
    if (name === 'SUPABASE_ANON_KEY') {
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';
    }
  }
  return value;
};

const SUPABASE_URL = getEnvVar('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');

// CRITICAL: Extensive debug logging
console.log('[Supabase] Initialization - URL:', !!SUPABASE_URL ? 'AVAILABLE' : 'MISSING', 
            'Key:', !!SUPABASE_ANON_KEY ? 'AVAILABLE' : 'MISSING');

// CRITICAL: Verify credentials are valid before proceeding
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] CRITICAL ERROR: Missing Supabase configuration');
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create a single Supabase client instance with explicit options
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,      // Persist session in localStorage
    autoRefreshToken: true,    // Automatically refresh tokens
    detectSessionInUrl: true,  // Look for tokens in URL after OAuth login
    storageKey: 'essential-memories-auth-v2', // Custom key to avoid conflicts
  }
});

// Immediate session check to verify connectivity
console.log('[Supabase] Testing connection and checking session...');
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('[Supabase] Initial session check FAILED:', error.message);
      // Don't throw here - allow the app to continue and show login screen
    } else {
      console.log('[Supabase] Initial session check SUCCESS - User:', 
                  data.session?.user ? `ID: ${data.session.user.id.substring(0,8)}...` : 'None');
    }
  })
  .catch(err => {
    console.error('[Supabase] Unexpected error during initial check:', err.message);
  });

// Helper function to get the current user ID with extensive error logging
export const getCurrentUserId = () => {
  try {
    const currentUser = supabase.auth.currentUser;
    if (!currentUser) {
      console.log('[Supabase] No current user found in getCurrentUserId');
      return null;
    }
    return currentUser.id;
  } catch (error) {
    console.error('[Supabase] Error in getCurrentUserId:', error.message);
    return null;
  }
};

// Helper function to manually refresh the session with error handling
export const refreshSession = async () => {
  try {
    console.log('[Supabase] Manually refreshing session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Supabase] Session refresh FAILED:', error.message);
      return false;
    }
    
    const hasValidSession = !!data.session;
    console.log('[Supabase] Session refresh result:', hasValidSession ? 'SUCCESS' : 'NO SESSION');
    return hasValidSession;
  } catch (error) {
    console.error('[Supabase] Unexpected error during session refresh:', error.message);
    return false;
  }
};

// Helper to get the current session with error handling
export const getSession = async () => {
  try {
    console.log('[Supabase] Fetching current session');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Supabase] getSession FAILED:', error.message);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('[Supabase] Unexpected error in getSession:', error.message);
    return null;
  }
};

export default supabase;