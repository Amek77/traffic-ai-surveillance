import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Violations from './pages/Violations';
import UploadDetect from './pages/UploadDetect';
import Operators from './pages/Operators';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/violations" 
            element={
              <ProtectedRoute>
                <Violations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadDetect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/operators" 
            element={
              <ProtectedRoute adminOnly={true}>
                <Operators />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect all other paths to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
