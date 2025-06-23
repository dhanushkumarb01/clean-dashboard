import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import DashboardContainer from "./pages/DashboardContainer";
import UserDashboardPage from "./pages/UserDashboardPage";
import LoginPage from "./pages/LoginPage";
import AuthError from "./pages/AuthError";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./utils/api";
import "./App.css";
import AuthCallback from './pages/AuthCallback';
import YouTubeReportPage from './pages/YouTubeReportPage';
import ChannelStatisticsPage from './pages/ChannelStatisticsPage';
import TelegramDashboard from './pages/TelegramDashboard/TelegramDashboard';
import WhatsAppDashboard from './pages/WhatsAppDashboard/WhatsAppDashboard';
import NotFound from './pages/NotFound';
import YouTubeDashboardContent from './pages/YouTubeDashboardPage/YouTubeDashboardContent';
import TelegramUserReportPage from './pages/TelegramDashboard/TelegramUserReportPage';
import TelegramGroupReportPage from './pages/TelegramDashboard/TelegramGroupReportPage';
import SignupPage from './pages/SignupPage';
import InstagramDashboard from './pages/InstagramDashboard';

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
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/google/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardContainer>
              <YouTubeDashboardContent />
            </DashboardContainer>
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
        <Route 
          path="/youtube/channel/:channelId" 
          element={<ProtectedRoute><ChannelStatisticsPage /></ProtectedRoute>}
        />
        <Route 
          path="/telegram" 
          element={
            <ProtectedRoute>
              <DashboardContainer>
                <TelegramDashboard />
              </DashboardContainer>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/whatsapp" 
          element={
            <ProtectedRoute>
              <DashboardContainer>
                <WhatsAppDashboard />
              </DashboardContainer>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/telegram/user/:userId"
          element={
            <ProtectedRoute>
              <DashboardContainer>
                <TelegramUserReportPage />
              </DashboardContainer>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/telegram/group/:groupId"
          element={
            <ProtectedRoute>
              <DashboardContainer>
                <TelegramGroupReportPage />
              </DashboardContainer>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/instagram" 
          element={
            <ProtectedRoute>
              <DashboardContainer>
                <InstagramDashboard />
              </DashboardContainer>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
