import { createClient } from '@supabase/supabase-js';

// Project details from Supabase
const SUPABASE_URL = 'https://lbuicopybuzhbhnrrzgw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidWljb3B5YnV6aGJobnJyemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDQ5NzEsImV4cCI6MjA2ODIyMDk3MX0.XeW54xnsdQitaRlT23gLjLEar1VOEKmyzzDtY4U5fOc';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to refresh session
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return false;
  }
};

export default supabase;