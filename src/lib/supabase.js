import { createClient } from '@supabase/supabase-js';

console.log('[Supabase] Initializing client...');

// Environment variables with fallbacks
const SUPABASE_URL = import.meta.env.VITE_APP_SUPABASE_URL || 'https://shtdwlskoalumikaqbtg.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';

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
  console.error('[Supabase] ERROR:', error);
  throw new Error(error);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true, // Enable for email confirmation
    autoRefreshToken: true,
    storageKey: 'essential-memories-auth'
  }
});

// Test connection
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

// Enhanced session refresh function
export const refreshSession = async () => {
  try {
    console.log('[Supabase] Refreshing session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Supabase] Session refresh failed:', error.message);
      return false;
    }
    
    console.log('[Supabase] Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('[Supabase] Session refresh error:', error.message);
    return false;
  }
};

console.log('[Supabase] Client initialized successfully');

export default supabase;