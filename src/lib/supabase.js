import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values for direct browser access
// This is acceptable for client-side auth with RLS policies properly configured
const SUPABASE_URL = 'https://shtdwlskoalumikaqbtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';

// Debugging logs to verify Supabase credentials are available
console.log('Supabase URL availability:', !!SUPABASE_URL, SUPABASE_URL);
console.log('Supabase ANON key availability:', !!SUPABASE_ANON_KEY, SUPABASE_ANON_KEY?.substring(0, 10) + '...');

// Verify Supabase variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('CRITICAL ERROR: Missing Supabase credentials');
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with explicit options
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test the connection immediately to verify it works
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Initial session check failed:', error);
  } else {
    console.log('Initial session check success, user:', data.session?.user ? 'Found' : 'None');
  }
});

export default supabase;