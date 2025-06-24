import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import "../App.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginMethod, setLoginMethod] = useState('google'); // 'google' or 'phone'
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

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
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
    } catch (error) {
      console.error('Login error:', error);
      // Handle error (show message to user)
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    console.log('Attempting phone login with:', { mobileNumber, password });
    // TODO: Implement actual API call for phone number login
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/login-phone`, {
        mobileNumber,
        password,
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate('/'); // Redirect to dashboard
      } else {
        // Handle login failure (e.g., show error message)
        console.error('Phone login failed:', response.data.message);
        alert(response.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Phone login error:', error);
      alert(error.response?.data?.message || 'An error occurred during login.');
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
            {loginMethod === 'google'
              ? 'Connect your YouTube channel to get started'
              : 'Enter your mobile number and password'
            }
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {loginMethod === 'google' ? (
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
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-6">
              <div>
                <label htmlFor="mobile-number" className="sr-only">Mobile Number</label>
                <input
                  id="mobile-number"
                  name="mobileNumber"
                  type="text"
                  autoComplete="tel"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in with Phone Number
              </button>
            </form>
          )}

          <div className="text-center">
            {loginMethod === 'google' ? (
              <button
                onClick={() => setLoginMethod('phone')}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Or Sign in with Phone Number
              </button>
            ) : (
              <button
                onClick={() => setLoginMethod('google')}
                className="font-medium text-red-600 hover:text-red-500 focus:outline-none"
              >
                Or Sign in with Google
              </button>
            )}
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account? {' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;