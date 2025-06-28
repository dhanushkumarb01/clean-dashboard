import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');
        const message = params.get('message');
        const state = params.get('state');

        if (error || message) {
          console.error('Auth error:', { error, message });
          navigate('/login', { state: { error: message || error } });
          return;
        }

        if (!token) {
          throw new Error('No token received');
        }

        // Store the token
        localStorage.setItem('token', token);

        // Check if user was trying to access YouTube dashboard
        if (state === 'youtube-dashboard') {
          navigate('/youtube-dashboard');
        } else {
          // Default redirect to main dashboard
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Callback error:', err);
        navigate('/login', { state: { error: err.message } });
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Completing sign in...</h2>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 