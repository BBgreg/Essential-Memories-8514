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

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

function App() {
  console.log('[App] Application starting...');
  
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;