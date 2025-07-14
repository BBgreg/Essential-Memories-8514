import { createClient } from '@supabase/supabase-js';

// Function to safely get environment variables with fallbacks
const getEnvVar = (name) => {
  const value = process.env[`NEXT_PUBLIC_${name}`] || 
                process.env[`REACT_APP_${name}`] || 
                process.env[`VITE_APP_${name}`] || 
                process.env[name];
  
  console.log(`[Supabase] ENV VAR CHECK - ${name}:`, value ? 'FOUND' : 'MISSING');
  
  // Hardcoded fallbacks for known project values if env vars are missing
  if (!value) {
    if (name === 'SUPABASE_URL') {
      console.log('[Supabase] Using hardcoded fallback URL');
      return 'https://shtdwlskoalumikaqbtg.supabase.co';
    }
    if (name === 'SUPABASE_ANON_KEY') {
      console.log('[Supabase] Using hardcoded fallback ANON KEY');
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
console.log('[Supabase] DEBUG: URL:', SUPABASE_URL);
console.log('[Supabase] DEBUG: ANON KEY (first 10 chars):', 
            SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'UNDEFINED');

// SIMPLIFIED APPROACH: Try creation regardless of env var check
let supabase = null;
try {
  console.log('[Supabase] Creating client...');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // SIMPLIFIED: Disable URL detection temporarily
      storageKey: 'essential-memories-auth-v2',
    }
  });
  console.log('[Supabase] Client created successfully');
} catch (error) {
  console.error('[Supabase] CRITICAL ERROR creating client:', error);
}

// SIMPLIFIED APPROACH: Basic connectivity test
console.log('[Supabase] Testing connection...');
if (supabase) {
  try {
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('[Supabase] Initial session check failed:', error.message);
        } else {
          console.log('[Supabase] Initial session check successful. Session exists:', !!data.session);
        }
      })
      .catch(err => {
        console.error('[Supabase] Unexpected error during session check:', err.message);
      });
  } catch (error) {
    console.error('[Supabase] Error during connection test:', error);
  }
} else {
  console.error('[Supabase] Cannot test connection - client is null');
}

// SIMPLIFIED APPROACH: Basic helper functions
export const refreshSession = async () => {
  try {
    if (!supabase) {
      console.error('[Supabase] Cannot refresh session - client is null');
      return false;
    }
    
    console.log('[Supabase] Trying to refresh session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Supabase] Session refresh error:', error.message);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('[Supabase] Error in refreshSession:', error.message);
    return false;
  }
};

export default supabase;