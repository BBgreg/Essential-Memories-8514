import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Add global error handling
window.onerror = (message, source, lineno, colno, error) => {
  console.error("DEBUG: App.jsx - Uncaught Global Error:", { message, source, lineno, colno, error });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error("DEBUG: App.jsx - Unhandled Promise Rejection:", event.reason);
});

console.log("DEBUG: App.jsx - Starting to load page components");

// Import pages with error handling
let Login, Signup, Home, AddMemory, Calendar, Flashcards, Profile, ForgotPassword, UpdatePassword, Terms, Privacy;

try {
  Login = React.lazy(() => {
    console.log("DEBUG: App.jsx - Loading Login component");
    return import('./pages/Login').then(module => {
      console.log("DEBUG: App.jsx - Login component loaded successfully");
      return module;
    }).catch(error => {
      console.error("DEBUG: App.jsx - Failed to load Login component:", error);
      throw error;
    });
  });

  Signup = React.lazy(() => import('./pages/Signup'));
  Home = React.lazy(() => import('./pages/Home'));
  AddMemory = React.lazy(() => import('./pages/AddMemory'));
  Calendar = React.lazy(() => import('./pages/Calendar'));
  Flashcards = React.lazy(() => import('./pages/Flashcards'));
  Profile = React.lazy(() => import('./pages/Profile'));
  ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
  UpdatePassword = React.lazy(() => import('./pages/UpdatePassword'));
  Terms = React.lazy(() => import('./pages/Terms'));
  Privacy = React.lazy(() => import('./pages/Privacy'));

  console.log("DEBUG: App.jsx - All page components set up for lazy loading");
} catch (error) {
  console.error("DEBUG: App.jsx - Error setting up lazy loading:", error);
}

// Styles
import './App.css';

const LoadingFallback = ({ componentName }) => {
  console.log(`DEBUG: App.jsx - Loading fallback for ${componentName}`);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading {componentName}...</p>
      </div>
    </div>
  );
};

function App() {
  console.log("DEBUG: App.jsx - App component rendering");

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MemoryProvider>
          <Router>
            <Layout>
              <React.Suspense fallback={<LoadingFallback componentName="page" />}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      (() => {
                        console.log("DEBUG: App.jsx - Router processing root path, redirecting to /login");
                        return <Navigate to="/login" replace />;
                      })()
                    } 
                  />
                  <Route 
                    path="/login" 
                    element={
                      (() => {
                        console.log("DEBUG: App.jsx - Router processing /login route");
                        return (
                          <React.Suspense fallback={<LoadingFallback componentName="Login" />}>
                            <Login />
                          </React.Suspense>
                        );
                      })()
                    } 
                  />
                  <Route 
                    path="/signup" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Signup" />}>
                        <Signup />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/forgot-password" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="ForgotPassword" />}>
                        <ForgotPassword />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/update-password" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="UpdatePassword" />}>
                        <UpdatePassword />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/terms" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Terms" />}>
                        <Terms />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/privacy" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Privacy" />}>
                        <Privacy />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/home" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Home" />}>
                        <Home />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/add" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="AddMemory" />}>
                        <AddMemory />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/calendar" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Calendar" />}>
                        <Calendar />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/flashcards" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Flashcards" />}>
                        <Flashcards />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <React.Suspense fallback={<LoadingFallback componentName="Profile" />}>
                        <Profile />
                      </React.Suspense>
                    } 
                  />
                  <Route 
                    path="*" 
                    element={
                      (() => {
                        console.log("DEBUG: App.jsx - Router processing catch-all route, redirecting to /login");
                        return <Navigate to="/login" replace />;
                      })()
                    } 
                  />
                </Routes>
              </React.Suspense>
            </Layout>
          </Router>
        </MemoryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

console.log("DEBUG: App.jsx - App component defined successfully");
export default App;