import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard/StatCard';
import { youtube } from '../utils/api';

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading Channel Statistics</p>
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
          Fetching channel data...
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
          Processing statistics...
        </div>
      </div>
    </div>
  </div>
);

const ChannelStatisticsPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [channelData, setChannelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching channel statistics for:', channelId);
        
        // Fetch channel statistics from backend
        const data = await youtube.getChannelStatistics(channelId);
        
        console.log('📊 Channel data received:', data);
        setChannelData(data);
        
      } catch (err) {
        console.error('❌ Error fetching channel statistics:', err);
        setError(err.message || 'Failed to fetch channel statistics');
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchChannelData();
    } else {
      setError('No channel ID provided');
      setLoading(false);
    }
  }, [channelId]);

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Channel Statistics</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Channel Statistics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Channel Statistics</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Data Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No statistics found for this channel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare statistics for display
  const stats = [
    { 
      label: "Subscriber Count", 
      value: channelData.subscriberCount?.toLocaleString() || "0" 
    },
    { 
      label: "View Count", 
      value: channelData.viewCount?.toLocaleString() || "0" 
    },
    { 
      label: "Video Count", 
      value: channelData.videoCount?.toLocaleString() || "0" 
    },
    { 
      label: "Comment Count", 
      value: channelData.commentCount?.toLocaleString() || "0" 
    },
    { 
      label: "Last Updated", 
      value: channelData.lastUpdated ? new Date(channelData.lastUpdated).toLocaleDateString() : "Today" 
    }
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
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
          <h1 className="text-2xl font-bold text-gray-800">Channel Statistics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {channelData.channelTitle || `Channel ID: ${channelId}`}
          </p>
        </div>
      </div>

      {/* Channel Info Section */}
      {(channelData.channelTitle || channelData.profilePicture) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            {channelData.profilePicture && (
              <img
                src={channelData.profilePicture}
                alt={channelData.channelTitle || 'Channel'}
                className="w-16 h-16 rounded-full mr-4"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {channelData.channelTitle || 'YouTube Channel'}
              </h2>
              <p className="text-sm text-gray-500">Channel ID: {channelId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Channel Statistics</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>These statistics show the current performance metrics for this YouTube channel, including subscriber count, total views, video count, and comment activity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelStatisticsPage;
