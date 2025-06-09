import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ErrorBoundary from './ErrorBoundary';

// API URL configuration - ensure consistent use of localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Validate API URL and ensure it uses localhost
if (!API_BASE_URL.includes('localhost')) {
  console.warn('API URL should use localhost instead of IP address. Current URL:', API_BASE_URL);
}

// YouTube Stats Display Component
const YouTubeStats = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No YouTube statistics available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Subscribers</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {stats?.subscriberCount?.toLocaleString() ?? 'N/A'}
        </p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {stats?.viewCount?.toLocaleString() ?? 'N/A'}
        </p>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">Videos</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {stats?.videoCount?.toLocaleString() ?? 'N/A'}
        </p>
      </div>
    </div>
  );
};

// Main YouTube Connect Component
const YouTubeConnect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (code) {
      console.log('OAuth callback detected with code');
      // Clear the URL parameters to prevent code reuse
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setIsConnected(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/youtube/channel`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setIsConnected(true);
        setStats(response.data.stats);
        setChannelInfo({
          title: response.data.channel_title,
          profilePicture: response.data.profile_picture
        });
      } catch (err) {
        console.error('Error checking YouTube connection:', err);
        if (err.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          setIsConnected(false);
        }
        setError(err.response?.data?.error || 'Failed to check YouTube connection');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    if (isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('Initiating YouTube connection...');
      const response = await axios.get(`${API_BASE_URL}/api/auth/google`);
      
      if (!response.data?.url) {
        throw new Error('Invalid response from server: missing auth URL');
      }
      
      // Store the current timestamp to prevent code reuse
      localStorage.setItem('youtube_auth_started', Date.now().toString());
      
      console.log('Redirecting to auth URL:', response.data.url);
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Error getting auth URL:', err);
      setError(err.response?.data?.error || 'Failed to start YouTube connection process');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        `${API_BASE_URL}/api/youtube/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Clear all YouTube-related data
      localStorage.removeItem('youtube_auth_started');
      setIsConnected(false);
      setStats(null);
      setChannelInfo(null);
    } catch (err) {
      console.error('Error disconnecting YouTube:', err);
      setError('Failed to disconnect YouTube account');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">YouTube Connection</h2>
              <p className="mt-1 text-sm text-gray-500">
                {isConnected ? 'Connected to YouTube' : 'Connect your YouTube channel to view analytics'}
              </p>
            </div>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect YouTube'}
              </button>
            )}
          </div>

          {isConnected && channelInfo && (
            <div className="mb-6 flex items-center space-x-4">
              {channelInfo.profilePicture && (
                <img
                  src={channelInfo.profilePicture}
                  alt="Channel"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{channelInfo.title}</h3>
                <p className="text-sm text-gray-500">YouTube Channel</p>
              </div>
            </div>
          )}

          <ErrorBoundary>
            {isConnected && <YouTubeStats stats={stats} />}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default YouTubeConnect;
