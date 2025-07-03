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
  const [commentsData, setCommentsData] = useState({ comments: [], aiAnalysis: null });
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);

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

  useEffect(() => {
    if (!channelId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    youtube.getChannelCommentsAndAnalysis(channelId)
      .then(data => setCommentsData(data))
      .catch(err => setCommentsError('Failed to load comments and analysis'))
      .finally(() => setCommentsLoading(false));
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

      {/* Sentiment Analysis Section */}
      <div className="mt-10 mb-8">
        <h2 className="text-xl font-bold text-pink-700 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764A2.236 2.236 0 0021 7.764V6a2 2 0 00-2-2h-1.764A2.236 2.236 0 0014 2.236V2a2 2 0 00-2-2H6a2 2 0 00-2 2v1.764A2.236 2.236 0 002.236 6H2a2 2 0 00-2 2v1.764A2.236 2.236 0 002 10h1.764A2.236 2.236 0 006 14v1.764A2.236 2.236 0 007.764 18H10a2 2 0 002 2h1.764A2.236 2.236 0 0014 21.764V22a2 2 0 002 2h1.764A2.236 2.236 0 0021 22h.236A2.236 2.236 0 0024 19.764V18a2 2 0 00-2-2h-1.764A2.236 2.236 0 0018 14v-1.764A2.236 2.236 0 0014 10z" /></svg>
          AI Sentiment Analysis
        </h2>
        {commentsLoading ? (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">Loading sentiment analysis...</div>
        ) : commentsError ? (
          <div className="bg-red-50 text-red-700 rounded-lg p-4">{commentsError}</div>
        ) : commentsData.aiAnalysis ? (
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl shadow-lg p-6 mb-6 border border-pink-100">
            <div className="mb-4 text-lg font-semibold text-pink-800">{commentsData.aiAnalysis.summary}</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-green-700">Positive</div>
                <div className="text-2xl font-bold text-green-800">{commentsData.aiAnalysis.sentimentBreakdown.positive || 0}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-red-700">Negative</div>
                <div className="text-2xl font-bold text-red-800">{commentsData.aiAnalysis.sentimentBreakdown.negative || 0}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-700">Neutral</div>
                <div className="text-2xl font-bold text-gray-800">{commentsData.aiAnalysis.sentimentBreakdown.neutral || 0}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-sm font-medium text-yellow-700">Scam Risk</div>
                <div className="text-lg font-bold text-yellow-800">{commentsData.aiAnalysis.scamRisk}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Comments Analyzed: <span className="font-semibold">{commentsData.aiAnalysis.totalMessagesAnalyzed}</span></div>
            {commentsData.aiAnalysis.scamKeywords && commentsData.aiAnalysis.scamKeywords.length > 0 && (
              <div className="mt-2 text-xs text-pink-700">Detected Keywords: {commentsData.aiAnalysis.scamKeywords.slice(0, 8).map((k, i) => <span key={i} className="inline-block bg-pink-100 text-pink-700 px-2 py-1 rounded mr-1 mb-1">{k}</span>)}{commentsData.aiAnalysis.scamKeywords.length > 8 && <span>+{commentsData.aiAnalysis.scamKeywords.length - 8} more</span>}</div>
            )}
          </div>
        ) : null}
      </div>

      {/* Comments Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2M15 3h-6a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>
          Channel Comments
        </h2>
        {commentsLoading ? (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">Loading comments...</div>
        ) : commentsError ? (
          <div className="bg-red-50 text-red-700 rounded-lg p-4">{commentsError}</div>
        ) : commentsData.comments && commentsData.comments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-lg border border-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700">Comment</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700">User</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700">Video</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {commentsData.comments.map((c, i) => (
                  <tr key={c.commentId} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="px-4 py-2 max-w-xs truncate" title={c.text}>{c.text}</td>
                    <td className="px-4 py-2">{c.authorDisplayName}</td>
                    <td className="px-4 py-2 font-medium text-blue-700">{c.videoTitle}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{new Date(c.publishedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">No comments found for this channel.</div>
        )}
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
