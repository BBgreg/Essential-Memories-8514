import { createClient } from '@supabase/supabase-js';

console.log("DEBUG: supabase.js - Module loading started");

const SUPABASE_URL = 'https://lbuicopybuzhbhnrrzgw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidWljb3B5YnV6aGJobnJyemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDQ5NzEsImV4cCI6MjA2ODIyMDk3MX0.XeW54xnsdQitaRlT23gLjLEar1VOEKmyzzDtY4U5fOc';

console.log("DEBUG: supabase.js - Environment variables check:", {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  urlPreview: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING'
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("DEBUG: supabase.js - Missing Supabase environment variables");
  throw new Error('Missing Supabase environment variables');
}

console.log("DEBUG: supabase.js - Initializing Supabase client");

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'essential-memories'
      }
    }
  });
  
  console.log("DEBUG: supabase.js - Supabase client created successfully");
} catch (error) {
  console.error("DEBUG: supabase.js - Failed to create Supabase client:", error);
  throw error;
}

// Enhanced session refresh with debugging
export const refreshSession = async () => {
  try {
    console.log("DEBUG: supabase.js - Attempting session refresh");
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('DEBUG: supabase.js - Session refresh error:', error);
      return false;
    }
    console.log("DEBUG: supabase.js - Session refresh successful");
    return true;
  } catch (error) {
    console.error('DEBUG: supabase.js - Session refresh failed:', error);
    return false;
  }
};

// Enhanced auth check with debugging
export const checkAuth = async () => {
  try {
    console.log("DEBUG: supabase.js - Checking authentication status");
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('DEBUG: supabase.js - Auth check error:', error);
      throw error;
    }
    
    const isAuthenticated = !!session?.user;
    console.log("DEBUG: supabase.js - Auth check result:", {
      isAuthenticated,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    return { isAuthenticated, user: session?.user };
  } catch (error) {
    console.error('DEBUG: supabase.js - Auth check failed:', error);
    return { isAuthenticated: false, user: null };
  }
};

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log("DEBUG: supabase.js - Testing database connection");
    // Test basic connectivity
    const { data, error } = await supabase
      .from('dates_esm1234567')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('DEBUG: supabase.js - Database connection test failed:', error);
      return false;
    }
    
    console.log("DEBUG: supabase.js - Database connection test successful");
    return true;
  } catch (error) {
    console.error('DEBUG: supabase.js - Database connection test exception:', error);
    return false;
  }
};

// Initialize connection test on module load
setTimeout(() => {
  testDatabaseConnection();
}, 1000);

console.log("DEBUG: supabase.js - Module loaded successfully");

export { supabase };
export default supabase;