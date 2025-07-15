import React from 'react';
import { Navigate } from 'react-router-dom';

// Simplified ProtectedRoute that doesn't rely on authentication state
const ProtectedRoute = ({ children }) => {
  // Since we've removed authentication, this component simply renders children
  // In a real app, this would check auth state
  return children;
  
  // Uncomment the following to simulate a "must login" experience:
  // return <Navigate to="/login" replace />;
};

export default ProtectedRoute;