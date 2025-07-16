import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lbuicopybuzhbhnrrzgw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidWljb3B5YnV6aGJobnJyemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDQ5NzEsImV4cCI6MjA2ODIyMDk3MX0.XeW54xnsdQitaRlT23gLjLEar1VOEKmyzzDtY4U5fOc';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('DEBUG: Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with debug logging
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  // Add debug logging
  debug: {
    onRequest: (request) => {
      console.log('DEBUG: Supabase Request:', {
        method: request.method,
        url: request.url,
        headers: request.headers
      });
    },
    onResponse: (response) => {
      console.log('DEBUG: Supabase Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    },
    onError: (error) => {
      console.error('DEBUG: Supabase Error:', error);
    }
  }
});

export default supabase;