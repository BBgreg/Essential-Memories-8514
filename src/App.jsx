import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddMemory from './pages/AddMemory';
import Calendar from './pages/Calendar';
import Flashcards from './pages/Flashcards';
import Statistics from './pages/Statistics';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Styles
import './App.css';

// Global error handling
const setupGlobalErrorHandling = () => {
  console.log('[App] Setting up global error handling');

  // Capture unhandled errors
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[App] Global error caught:', {
      message,
      source,
      lineno,
      colno,
      error
    });
    // Call the original handler if it exists
    if (originalOnError) return originalOnError(message, source, lineno, colno, error);
    return false;
  };

  // Capture unhandled promise rejections
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    console.error('[App] Unhandled Promise Rejection:', event.reason);
    // Call the original handler if it exists
    if (originalOnUnhandledRejection) return originalOnUnhandledRejection(event);
  };

  return () => {
    // Restore original handlers on cleanup
    window.onerror = originalOnError;
    window.onunhandledrejection = originalOnUnhandledRejection;
  };
};

// Simple global loading component with animation and message
const GlobalLoading = ({ message = "Loading application..." }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-lg font-medium text-text-primary">{message}</p>
      <p className="text-sm text-text-secondary">Please wait...</p>
    </div>
  </div>
);

// Simple error display component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-50">
    <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Application Error</h2>
      <p className="text-gray-600">{error.message || "An unexpected error occurred."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

function App() {
  // Set up global error handling
  useEffect(() => {
    console.log('[App] Initializing with URL:', window.location.href);
    console.log('[App] App Version:', '1.0.9'); // Increment version for tracking
    console.log('[App] Environment:', process.env.NODE_ENV);
    
    // Log any environment variables (without exposing sensitive data)
    console.log('[App] Environment Variables Check:', {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'FOUND' : 'MISSING',
      REACT_APP_SUPABASE_URL: !!process.env.REACT_APP_SUPABASE_URL ? 'FOUND' : 'MISSING',
      VITE_APP_SUPABASE_URL: !!process.env.VITE_APP_SUPABASE_URL ? 'FOUND' : 'MISSING',
      SUPABASE_URL: !!process.env.SUPABASE_URL ? 'FOUND' : 'MISSING',
      
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING',
      REACT_APP_SUPABASE_ANON_KEY: !!process.env.REACT_APP_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING',
      VITE_APP_SUPABASE_ANON_KEY: !!process.env.VITE_APP_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING',
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING',
    });
    
    // Setup global error handling
    return setupGlobalErrorHandling();
  }, []);

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <MemoryProvider>
            <Router>
              <AppContent />
            </Router>
          </MemoryProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// Separate component to access auth context
function AppContent() {
  const { user, loading, authError } = useAuth();

  // Log important state changes
  useEffect(() => {
    console.log('[AppContent] Auth state changed:', {
      isAuthenticated: !!user,
      isLoading: loading,
      hasError: !!authError,
      currentPath: window.location.hash
    });
  }, [user, loading, authError]);

  // SIMPLIFIED APPROACH: If there's an auth error, show it but continue to login page
  useEffect(() => {
    if (authError) {
      console.error('[AppContent] Authentication error detected:', authError);
      // Continue to login page instead of showing error screen
    }
  }, [authError]);

  // SIMPLIFIED APPROACH: Handle initial loading state with timeout
  if (loading) {
    console.log('[AppContent] Auth still loading, showing global loading indicator');
    return <GlobalLoading message="Checking authentication..." />;
  }

  // SIMPLIFIED APPROACH: Always redirect to login/signup if not on those pages
  // This ensures we can at least access the login screen
  if (!window.location.hash.includes('/login') && 
      !window.location.hash.includes('/signup') &&
      !window.location.hash.includes('/forgot-password') &&
      !window.location.hash.includes('/update-password') &&
      !window.location.hash.includes('/terms') &&
      !window.location.hash.includes('/privacy')) {
    console.log('[AppContent] Not on auth page, redirecting to login (simplified approach)');
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        {/* SIMPLIFIED APPROACH: Always redirect root to login */}
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />

        {/* Public Routes - Always accessible */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* SIMPLIFIED APPROACH: Make all routes temporarily accessible */}
        {/* This helps diagnose if authentication is the blocker */}
        <Route path="/home" element={<Home />} />
        <Route path="/add" element={<AddMemory />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/profile" element={<Profile />} />

        {/* Fallback for any unknown paths - always redirect to login */}
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </Layout>
  );
}

export default App;