import { createClient } from '@supabase/supabase-js';

console.log('[Supabase] Initializing client...');

// Function to safely get environment variables with fallbacks
const getEnvVar = (name, fallback) => {
  const val = import.meta.env[`VITE_APP_${name}`] || 
              import.meta.env[`REACT_APP_${name}`] ||
              import.meta.env[name] || 
              fallback;
  
  console.log(`[Supabase] Env Var Check - ${name}:`, val ? 'FOUND' : 'MISSING');
  return val;
};

// Environment variables with fallbacks
const SUPABASE_URL = getEnvVar('SUPABASE_URL', 'https://shtdwlskoalumikaqbtg.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY');

// Log configuration
console.log('[Supabase] Configuration:', {
  URL: SUPABASE_URL,
  KEY_PREFIX: SUPABASE_ANON_KEY.substring(0, 10) + '...',
  USING_ENV_URL: !!import.meta.env.VITE_APP_SUPABASE_URL,
  USING_ENV_KEY: !!import.meta.env.VITE_APP_SUPABASE_ANON_KEY
});

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const error = 'Missing Supabase configuration. Please check environment variables.';
  console.error('[Supabase] FATAL ERROR:', error);
  throw new Error(error);
}

let supabase = null;

try {
  // Create Supabase client with robust options
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true, // Enable for email confirmation
      autoRefreshToken: true,
      storageKey: 'essential-memories-auth'
    }
  });
  console.log('[Supabase] Client initialized successfully');
} catch (initError) {
  console.error('[Supabase] FATAL ERROR: Client initialization failed:', initError);
  supabase = null;
}

// Test connection immediately
if (supabase) {
  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error('[Supabase] Initial session check failed:', error.message);
      } else {
        console.log('[Supabase] Initial session check:', data.session ? 'Session found' : 'No session');
      }
    })
    .catch(err => {
      console.error('[Supabase] Unexpected error during session check:', err.message);
    });
}

// Enhanced session refresh function
export const refreshSession = async () => {
  if (!supabase) {
    console.error('[Supabase] Cannot refresh session: Client not initialized');
    return false;
  }
  
  try {
    console.log('[Supabase] Refreshing session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Supabase] Session refresh failed:', error.message);
      return false;
    }
    
    console.log('[Supabase] Session refreshed successfully:', data.session ? 'New session obtained' : 'No session');
    return !!data.session;
  } catch (error) {
    console.error('[Supabase] Session refresh error:', error.message);
    return false;
  }
};

// Function to get current user with error handling
export const getCurrentUser = async () => {
  if (!supabase) {
    console.error('[Supabase] Cannot get user: Client not initialized');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Supabase] Error getting current user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('[Supabase] Unexpected error getting current user:', error.message);
    return null;
  }
};

export default supabase;