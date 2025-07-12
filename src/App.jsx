import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MemoryProvider } from './contexts/MemoryContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
// ... rest of your imports

function App() {
  return (
    <AuthProvider>
      <MemoryProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Your routes */}
            </Routes>
          </Layout>
        </Router>
      </MemoryProvider>
    </AuthProvider>
  );
}

export default App;