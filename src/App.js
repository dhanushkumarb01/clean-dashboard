import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import LoginPage from "./pages/LoginPage";
import AuthError from "./pages/AuthError";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./utils/api";
import "./App.css";
import AuthCallback from './pages/AuthCallback';
import YouTubeReportPage from './pages/YouTubeReportPage';
import NotFound from './pages/NotFound';

// Auth callback handler component
const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    if (error) {
      navigate(`/auth/error?message=${encodeURIComponent(error)}`);
    } else if (code) {
      // Construct the callback URL properly
      const apiBase = process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
      const callbackUrl = `${apiBase}/api/auth/google/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
      
      console.log('Redirecting to callback URL:', callbackUrl);
      window.location.href = callbackUrl;
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
};

// Main App layout for the dashboard
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/google/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/user/:id" element={
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        } />
        <Route 
          path="/youtube-report/:authorChannelId" 
          element={<ProtectedRoute><YouTubeReportPage /></ProtectedRoute>}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
