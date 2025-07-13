import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://shtdwlskoalumikaqbtg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';

// Debugging logs to verify Supabase credentials are available
console.log('Supabase URL availability:', !!SUPABASE_URL);
console.log('Supabase ANON key availability:', !!SUPABASE_ANON_KEY);

// Verify Supabase variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with explicit options
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    debug: true // Enable debug mode temporarily
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: (...args) => {
      console.log('Supabase fetch request:', args[0]);
      return fetch(...args);
    }
  }
});

// Test the connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state change event:', event);
  console.log('Session user ID:', session?.user?.id || 'No user');
});

export default supabase;