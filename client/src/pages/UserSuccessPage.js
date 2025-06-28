import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-logout after 5 seconds
    const timer = setTimeout(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h1>
          <p className="text-gray-600">You have logged in as a user successfully.</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            You will be automatically logged out in 5 seconds for security purposes.
          </p>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Logout Now
        </button>
      </div>
    </div>
  );
};

export default UserSuccessPage; 