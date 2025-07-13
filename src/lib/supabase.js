import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values for direct browser access
// This is acceptable for client-side auth with RLS policies properly configured
const SUPABASE_URL = 'https://shtdwlskoalumikaqbtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';

// Debugging logs to verify Supabase credentials are available
console.log('[Supabase] URL availability:', !!SUPABASE_URL, SUPABASE_URL);
console.log('[Supabase] ANON key availability:', !!SUPABASE_ANON_KEY, SUPABASE_ANON_KEY?.substring(0, 10) + '...');

// Verify Supabase variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] CRITICAL ERROR: Missing Supabase credentials');
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with explicit options
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'essential-memories-auth', // Use a unique key for local storage
  }
});

// Test the connection immediately to verify it works
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('[Supabase] Initial session check failed:', error);
  } else {
    console.log('[Supabase] Initial session check success, user:', data.session?.user ? 'Found' : 'None');
    
    // Log additional information about the current user
    const currentUser = supabase.auth.currentUser;
    if (currentUser) {
      console.log('[Supabase] Current user ID:', currentUser.id);
      console.log('[Supabase] Current user email:', currentUser.email);
    } else {
      console.log('[Supabase] No current user found');
    }
  }
});

// Add a helper method to check current auth status
export const getCurrentUserId = () => {
  const currentUser = supabase.auth.currentUser;
  if (!currentUser) {
    console.error('[Supabase] No authenticated user found in session');
    return null;
  }
  return currentUser.id;
};

// Add a helper method to refresh the session
export const refreshSession = async () => {
  try {
    console.log('[Supabase] Attempting to refresh session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[Supabase] Session refresh error:', error);
      return false;
    }
    
    console.log('[Supabase] Session refreshed successfully:', !!data.session);
    return !!data.session;
  } catch (error) {
    console.error('[Supabase] Session refresh exception:', error);
    return false;
  }
};

// Add a helper to get the session directly
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Supabase] getSession error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('[Supabase] getSession exception:', error);
    return null;
  }
};

export default supabase;