import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { telegram } from '../../utils/api'; // Assuming you have telegram API calls

const TelegramGroupReportPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching Telegram group report for groupId: ${groupId}`);
        
        // Get the phone from localStorage or use a default
        const phone = localStorage.getItem('telegramPhone') || '';
        const data = await telegram.getGroupReport(groupId, phone);

        if (data) {
          setGroupData(data);
        } else {
          setError('No data found for this Telegram group.');
        }
      } catch (err) {
        console.error('Error fetching Telegram group data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch group report.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupData();
    } else {
      setError('No group ID provided.');
      setLoading(false);
    }
  }, [groupId]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading group report...</p>
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
              <h3 className="text-sm font-medium text-red-800">Error Loading Group Report</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!groupData) {
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
              <h3 className="text-sm font-medium text-yellow-800">No Group Data Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No statistics found for this Telegram group.</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Telegram Group Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            {groupData.title} {groupData.username ? `(@${groupData.username})` : ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl mr-4">
            {groupData.title ? groupData.title[0].toUpperCase() : (groupData.username ? groupData.username[0].toUpperCase() : 'G')}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {groupData.title}
            </h2>
            <p className="text-sm text-gray-500">@{groupData.username || 'N/A'}</p>
            <p className="text-sm text-gray-500">Group ID: {groupData.groupId}</p>
            <p className="text-sm text-gray-500">Members: {groupData.memberCount?.toLocaleString() || '0'}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for group stats cards or charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Group Statistics Cards */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{groupData.messageCount?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Members</h3>
          <p className="text-3xl font-bold text-green-600">{groupData.memberCount?.toLocaleString() || '0'}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Group Type</h3>
          <p className="text-lg font-bold text-purple-600">{groupData.isChannel ? 'Channel' : 'Group'}</p>
        </div>
      </div>

      {/* Group Details Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Title:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {groupData.title || 'Unknown Group'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Username:</span>
              <span className="text-sm text-gray-900">
                {groupData.username ? `@${groupData.username}` : 'Not provided'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Message Count:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {groupData.messageCount?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Group ID:</span>
              <span className="text-sm text-gray-900 font-mono">{groupData.groupId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Member Count:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {groupData.memberCount?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <span className="text-sm text-gray-900">
                {groupData.isChannel ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Channel
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Group
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-yellow-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Activity Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Messages per Member:</span>
              <span className="text-sm font-semibold text-gray-900">
                {groupData.memberCount && groupData.messageCount 
                  ? (groupData.messageCount / groupData.memberCount).toFixed(2)
                  : '0'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Activity Level:</span>
              <span className="text-sm text-gray-900">
                {groupData.messageCount > 1000 ? 'Very Active' : 
                 groupData.messageCount > 500 ? 'Active' : 
                 groupData.messageCount > 100 ? 'Moderate' : 'Low'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-2">Group Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Has Username:</span>
              <span className="text-sm font-semibold text-gray-900">
                {groupData.username ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Public Link:</span>
              <span className="text-sm text-gray-900">
                {groupData.username ? `t.me/${groupData.username}` : 'Private'}
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
            <h3 className="text-sm font-medium text-blue-800">Group Report Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This page displays detailed statistics and activity for a specific Telegram group or channel, including message counts and member statistics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramGroupReportPage; 