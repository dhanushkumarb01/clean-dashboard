import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../App.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Check for error messages in URL
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const message = params.get('message');
    if (error || message) {
      console.error('Auth error:', { error, message });
      // You might want to show this to the user via a toast/alert
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    try {
      // Redirect to backend's Google OAuth endpoint
      window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/google`;
    } catch (error) {
      console.error('Login error:', error);
      // Handle error (show message to user)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connect your YouTube channel to get started
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-red-500 group-hover:text-red-400" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
            </span>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;