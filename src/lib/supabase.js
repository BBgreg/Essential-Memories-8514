import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dnxvucdnduwlfwzrfwoh.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueHZ1Y2RuZHV3bGZ3enJmd29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDgzMjUsImV4cCI6MjA2ODE4NDMyNX0.nYAkn11h9mkDuxxdd82JBHYdNWfoS_qwWu-PhKzjt5A';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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