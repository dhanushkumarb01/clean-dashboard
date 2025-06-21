import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { telegram } from '../../utils/api'; // Assuming you have telegram API calls
// import TelegramStatCard from '../../components/StatCard/StatCard'; // Re-use if suitable, or create a Telegram specific one

const TelegramUserReportPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching Telegram user report for userId: ${userId}`);
        // TODO: Implement a backend API call to fetch specific user data
        // For now, simulating data or fetching from a mock source
        const data = await telegram.getUserReport(userId); // This API call needs to be implemented

        if (data) {
          setUserData(data);
        } else {
          setError('No data found for this Telegram user.');
        }
      } catch (err) {
        console.error('Error fetching Telegram user data:', err);
        setError(err.message || 'Failed to fetch user report.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setError('No user ID provided.');
      setLoading(false);
    }
  }, [userId]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading user report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading User Report</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No User Data Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No statistics found for this Telegram user.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Telegram User Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            {userData.firstName} {userData.lastName} {userData.username ? `(@${userData.username})` : ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl mr-4">
            {userData.firstName ? userData.firstName[0].toUpperCase() : (userData.username ? userData.username[0].toUpperCase() : 'U')}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {userData.firstName} {userData.lastName}
            </h2>
            <p className="text-sm text-gray-500">@{userData.username || 'N/A'}</p>
            <p className="text-sm text-gray-500">Telegram ID: {userData.userId}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for user stats cards or charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* User Statistics Cards */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{userData.messageCount?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Telegram ID</h3>
          <p className="text-lg font-bold text-green-600">{userData.telegramId || 'N/A'}</p>
        </div>
      </div>

      {/* User Details Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">User Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Full Name:</span>
              <span className="text-sm text-gray-900">
                {userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.firstName || userData.lastName || 'Not provided'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Username:</span>
              <span className="text-sm text-gray-900">
                {userData.username ? `@${userData.username}` : 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Message Count:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {userData.messageCount?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Telegram ID:</span>
              <span className="text-sm text-gray-900 font-mono">{userData.telegramId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Activity Level:</span>
              <span className="text-sm text-gray-900">
                {userData.messageCount > 100 ? 'Very Active' : 
                 userData.messageCount > 50 ? 'Active' : 
                 userData.messageCount > 20 ? 'Moderate' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">User Report Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This page displays detailed statistics and activity for a specific Telegram user, including their message count and last activity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramUserReportPage; 