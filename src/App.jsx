import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Direct page imports - no AuthProvider or Context dependencies
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

function App() {
  console.log('🚀 DEBUG: App.jsx - Initial render START');
  console.log('🔍 DEBUG: Current URL:', window.location.href);
  console.log('🔧 DEBUG: Running in environment:', process.env.NODE_ENV);
  
  // Log environment variables presence (without exposing values)
  console.log('📋 DEBUG: Environment Variables Check:', {
    VITE_APP_SUPABASE_URL: !!import.meta.env.VITE_APP_SUPABASE_URL ? '✅ FOUND' : '❌ MISSING',
    VITE_APP_SUPABASE_ANON_KEY: !!import.meta.env.VITE_APP_SUPABASE_ANON_KEY ? '✅ FOUND' : '❌ MISSING'
  });

  return (
    <Router>
      {(() => {
        console.log('🎯 DEBUG: Router rendering, preparing routes...');
        return (
          <Routes>
            {/* Force root to login - IMMEDIATE AND UNCONDITIONAL */}
            <Route 
              path="/" 
              element={
                (() => {
                  console.log('⚡ DEBUG: Root path "/" accessed - FORCING redirect to /login');
                  return <Navigate to="/login" replace />;
                })()
              } 
            />

            {/* Public Routes - NO AUTH CHECKS */}
            <Route 
              path="/login" 
              element={
                (() => {
                  console.log('🔑 DEBUG: Rendering Login page');
                  return <Login />;
                })()
              } 
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* App Routes - TEMPORARILY ACCESSIBLE WITHOUT AUTH */}
            <Route path="/home" element={<Home />} />
            <Route path="/add" element={<AddMemory />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/profile" element={<Profile />} />

            {/* Catch all unknown routes - redirect to login */}
            <Route 
              path="*" 
              element={
                (() => {
                  console.log('⚠️ DEBUG: Unknown route accessed - redirecting to /login');
                  return <Navigate to="/login" replace />;
                })()
              } 
            />
          </Routes>
        );
      })()}
    </Router>
  );
}

export default App;