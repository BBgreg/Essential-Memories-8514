import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
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

// Debug component to wrap routes for debugging
const DebugRoute = ({ children, path }) => {
  console.log(`DEBUG: Rendering route: ${path}`);
  return <>{children}</>;
};

// Error fallback for the Add Memory page
const AddMemoryErrorFallback = ({ error }) => {
  console.error("DEBUG: AddMemory Error Fallback triggered", error);
  return (
    <div className="p-6 space-y-6">
      <div className="bg-red-50 text-red-600 rounded-xl p-4 flex items-center">
        <p className="text-sm">Error loading Add Memory page: {error?.message || "Unknown error"}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-vibrant-pink to-vibrant-teal text-white py-2 px-4 rounded-xl"
      >
        Try Again
      </button>
    </div>
  );
};

// Wrapper for the AddMemory component with error handling
const AddMemoryWithErrorHandling = () => {
  console.log("DEBUG: AddMemory wrapper rendering");
  try {
    return <AddMemory />;
  } catch (error) {
    console.error("DEBUG: Error caught in AddMemory wrapper", error);
    return <AddMemoryErrorFallback error={error} />;
  }
};

function App() {
  console.log("DEBUG: App component rendering");
  
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <MemoryProvider>
            <Layout>
              <Routes>
                <Route path="/" element={
                  <DebugRoute path="/">
                    <Navigate to="/login" replace />
                  </DebugRoute>
                } />
                <Route path="/login" element={
                  <DebugRoute path="/login">
                    <Login />
                  </DebugRoute>
                } />
                <Route path="/signup" element={
                  <DebugRoute path="/signup">
                    <Signup />
                  </DebugRoute>
                } />
                <Route path="/forgot-password" element={
                  <DebugRoute path="/forgot-password">
                    <ForgotPassword />
                  </DebugRoute>
                } />
                <Route path="/update-password" element={
                  <DebugRoute path="/update-password">
                    <UpdatePassword />
                  </DebugRoute>
                } />
                <Route path="/terms" element={
                  <DebugRoute path="/terms">
                    <Terms />
                  </DebugRoute>
                } />
                <Route path="/privacy" element={
                  <DebugRoute path="/privacy">
                    <Privacy />
                  </DebugRoute>
                } />
                <Route path="/home" element={
                  <DebugRoute path="/home">
                    <Home />
                  </DebugRoute>
                } />
                <Route path="/add" element={
                  <DebugRoute path="/add">
                    <ErrorBoundary>
                      <AddMemoryWithErrorHandling />
                    </ErrorBoundary>
                  </DebugRoute>
                } />
                <Route path="/calendar" element={
                  <DebugRoute path="/calendar">
                    <Calendar />
                  </DebugRoute>
                } />
                <Route path="/flashcards" element={
                  <DebugRoute path="/flashcards">
                    <Flashcards />
                  </DebugRoute>
                } />
                <Route path="/statistics" element={
                  <DebugRoute path="/statistics">
                    <Statistics />
                  </DebugRoute>
                } />
                <Route path="/profile" element={
                  <DebugRoute path="/profile">
                    <Profile />
                  </DebugRoute>
                } />
                <Route path="*" element={
                  <DebugRoute path="*">
                    <Navigate to="/login" replace />
                  </DebugRoute>
                } />
              </Routes>
            </Layout>
          </MemoryProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;