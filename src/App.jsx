import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Import pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
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

// Global error handler
const GlobalErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white/90 p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened. This could be due to a configuration issue or network problem.
          </p>
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
            Refresh Page
          </button>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
};

function AppContent() {
  const { user, loading } = useAuth();

  // Handle redirection for authenticated users who land on auth pages
  useEffect(() => {
    if (!loading && user) {
      const currentHash = window.location.hash;
      if (currentHash === '#/login' || currentHash === '#/signup' || currentHash === '#/') {
        console.log('[App] Authenticated user on auth page, redirecting to /home');
        window.location.hash = '/home';
      }
    }
  }, [user, loading]);

  console.log('[App] Current state:', {
    isAuthenticated: !!user,
    isLoading: loading,
    currentPath: window.location.hash
  });

  // Display loading state for initial authentication check
  if (loading) {
    console.log('[App] App is in LOADING state');
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium text-text-primary">Initializing application...</p>
          <p className="text-sm text-text-secondary">This should only take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <MemoryProvider>
      <Layout>
        <Routes>
          {/* Root redirect */}
          <Route 
            path="/" 
            element={
              (() => {
                console.log('[App] Root path accessed, redirecting to login');
                return <Navigate to="/login" replace />;
              })()
            } 
          />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected routes */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add" 
            element={
              <ProtectedRoute>
                <AddMemory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/flashcards" 
            element={
              <ProtectedRoute>
                <Flashcards />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/statistics" 
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </MemoryProvider>
  );
}

function App() {
  console.log('[App] Application starting...');
  
  return (
    <GlobalErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;