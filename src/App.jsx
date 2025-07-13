import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

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
    console.error('[App] Global error caught:', { message, source, lineno, colno, error });
    
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

// Simple global loading component
const GlobalLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/90 z-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg font-medium text-text-primary">Loading application...</p>
    </div>
  </div>
);

function App() {
  // Set up global error handling
  useEffect(() => {
    console.log('[App] Initializing with URL:', window.location.href);
    console.log('[App] App Version:', '1.0.3'); // Increment version for tracking
    
    // Setup global error handling
    return setupGlobalErrorHandling();
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        <MemoryProvider>
          <Router>
            <AppContent />
          </Router>
        </MemoryProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}

// Separate component to access auth context
function AppContent() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><AddMemory /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all route - redirect to home or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;