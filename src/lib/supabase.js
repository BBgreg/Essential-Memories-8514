import { createClient } from '@supabase/supabase-js';

console.log('🔧 DEBUG: Initializing Supabase client...');

// Hardcoded credentials as fallback
const FALLBACK_URL = 'https://shtdwlskoalumikaqbtg.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGR3bHNrb2FsdW1pa2FxYnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3ODk3MDgsImV4cCI6MjA2NzM2NTcwOH0.i4egQfsYmumV5sclre4GCV33aGPFIFmdtEYHvarxzoY';

// Try to get environment variables first
const SUPABASE_URL = import.meta.env.VITE_APP_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_APP_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Log configuration (without exposing full key)
console.log('📋 DEBUG: Supabase Configuration:', {
  URL: SUPABASE_URL,
  KEY_PREFIX: SUPABASE_ANON_KEY.substring(0, 10) + '...',
  USING_FALLBACK_URL: SUPABASE_URL === FALLBACK_URL ? '⚠️ YES' : '✅ NO',
  USING_FALLBACK_KEY: SUPABASE_ANON_KEY === FALLBACK_KEY ? '⚠️ YES' : '✅ NO'
});

// Create Supabase client with minimal configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    storageKey: 'essential-memories-auth-v2'
  }
});

// Verify client creation
if (supabase) {
  console.log('✅ DEBUG: Supabase client created successfully');
} else {
  console.error('❌ DEBUG: Failed to create Supabase client');
}

// Test connection
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ DEBUG: Initial session check failed:', error.message);
    } else {
      console.log('🔍 DEBUG: Initial session check:', data.session ? '✅ Session found' : '⚠️ No session');
    }
  })
  .catch(err => {
    console.error('💥 DEBUG: Unexpected error during session check:', err.message);
  });

export default supabase;