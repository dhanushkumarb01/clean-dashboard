import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { telegram } from '../../utils/api';

const TelegramUserReportPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  // Use state for the Telegram ID being searched
  const [searchId, setSearchId] = useState(params.userId || '');
  const [currentId, setCurrentId] = useState(params.userId || '');
  const [userDetails, setUserDetails] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data when currentId changes
  useEffect(() => {
    if (!currentId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await telegram.getUserSummary(currentId);
        setUserDetails(user);
      } catch (err) {
        setError('Failed to fetch user data.');
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentId]);

  const handleBackClick = () => navigate(-1);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId && searchId !== currentId) {
      setCurrentId(searchId);
      setTab(0);
    }
  };

  // Tab content
  const renderTabContent = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (!userDetails) return <div className="p-4 text-center">No user data.</div>;
    switch (tab) {
      case 0:
        return (
          <div className="p-4">
            <div className="font-semibold mb-4 text-lg">AI Analysis</div>
            
            {/* AI Summary */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Summary</div>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-800 leading-relaxed">
                {userDetails.aiAnalysis?.summary || 'No analysis available.'}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Risk Assessment</div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Risk Level:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  userDetails.risk === 'High Risk' ? 'bg-red-100 text-red-700' :
                  userDetails.risk === 'Medium Risk' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {userDetails.risk || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Sentiment Analysis</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Positive</div>
                  <div className="text-lg font-bold text-green-800">
                    {userDetails.aiAnalysis?.sentimentBreakdown?.positive || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-700">Negative</div>
                  <div className="text-lg font-bold text-red-800">
                    {userDetails.aiAnalysis?.sentimentBreakdown?.negative || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Neutral</div>
                  <div className="text-lg font-bold text-gray-800">
                    {userDetails.aiAnalysis?.sentimentBreakdown?.neutral || 0}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Overall Sentiment: <span className="font-medium">{userDetails.aiAnalysis?.sentiment || 'Neutral'}</span>
              </div>
            </div>

            {/* Scam Detection */}
            {userDetails.aiAnalysis?.scamKeywords && userDetails.aiAnalysis.scamKeywords.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Detected Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {userDetails.aiAnalysis.scamKeywords.slice(0, 8).map((keyword, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                  {userDetails.aiAnalysis.scamKeywords.length > 8 && (
                    <span className="text-xs text-gray-500">
                      +{userDetails.aiAnalysis.scamKeywords.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Stats */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Analysis Statistics</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Messages Analyzed</div>
                  <div className="text-lg font-bold text-blue-800">
                    {userDetails.aiAnalysis?.totalMessagesAnalyzed || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-orange-700">Suspicious Messages</div>
                  <div className="text-lg font-bold text-orange-800">
                    {userDetails.aiAnalysis?.scamMessageCount || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Active */}
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Last Active</div>
              <div className="text-sm text-gray-800">
                {userDetails.lastActive ? new Date(userDetails.lastActive).toLocaleString() : 'Unknown'}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="p-4">
            <div className="font-semibold mb-2">Recent Messages</div>
            <ul className="divide-y">
              {userDetails?.recentMessages && userDetails.recentMessages.length > 0 ? userDetails.recentMessages.map((msg, idx) => (
                <li key={msg.id || idx} className="py-2">
                  <div className="text-gray-800">{msg.text || 'No text'}</div>
                  <div className="text-xs text-gray-500">{msg.chatName ? `Group: ${msg.chatName}` : ''}</div>
                  <div className="text-xs text-gray-400">{msg.date ? new Date(msg.date).toLocaleString() : ''}</div>
                </li>
              )) : <div>No recent messages.</div>}
            </ul>
          </div>
        );
      case 2:
        return (
          <div className="p-4">
            <div className="font-semibold mb-2">Joined Groups</div>
            {userDetails?.joinedGroups && userDetails.joinedGroups.length > 0 ? (
              <ul className="divide-y">
                {userDetails.joinedGroups.map((group, idx) => (
                  <li key={group || idx} className="py-2 text-blue-800 font-medium">{group}</li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No joined groups found.</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Telegram ID..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
            disabled={loading || !searchId}
          >
            Search
          </button>
        </form>
        <div className="bg-blue-900 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-4xl font-bold text-white shadow-lg mr-6">
              {userDetails?.firstName ? userDetails.firstName[0].toUpperCase() : (userDetails?.username ? userDetails.username[0].toUpperCase() : 'U')}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{userDetails?.firstName} {userDetails?.lastName}</div>
              <div className="text-md text-blue-100 font-semibold">@{userDetails?.username || 'N/A'}</div>
              <div className="text-md text-blue-200 font-mono">Telegram ID: {userDetails?.telegramId || currentId}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-900 rounded-lg shadow-lg p-6">
            <div className="text-lg font-semibold text-green-100 mb-2">Total Messages</div>
            <div className="text-4xl font-extrabold text-white">{userDetails?.messageCount?.toLocaleString() || '0'}</div>
          </div>
          <div className="bg-blue-900 rounded-lg shadow-lg p-6">
            <div className="text-lg font-semibold text-blue-100 mb-2">Groups</div>
            <div className="text-3xl font-bold text-white">{userDetails?.groupCount || 0}</div>
            <div className="text-xs text-blue-200 mt-1 font-semibold">Last Active: {userDetails?.lastActive ? new Date(userDetails.lastActive).toLocaleString() : '-'}</div>
          </div>
        </div>
        <div className="bg-blue-900 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-100">Full Name:</span>
                <span className="text-sm text-white font-bold">{userDetails?.firstName && userDetails?.lastName ? `${userDetails.firstName} ${userDetails.lastName}` : userDetails?.firstName || userDetails?.lastName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-100">Username:</span>
                <span className="text-sm text-white font-bold">{userDetails?.username ? `@${userDetails.username}` : 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-100">Bio:</span>
                <span className="text-sm text-green-100">{userDetails?.bio || '-'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-100">Telegram ID:</span>
                <span className="text-sm text-blue-200 font-mono font-bold">{userDetails?.telegramId || currentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-100">Activity Level:</span>
                <span className="text-sm text-white">{userDetails?.activityLevel || '-'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg shadow p-4">
          <div className="flex border-b mb-4">
            <button className={`flex-1 py-2 font-semibold ${tab === 0 ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`} onClick={() => setTab(0)}>AI Analysis</button>
            <button className={`flex-1 py-2 font-semibold ${tab === 1 ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`} onClick={() => setTab(1)}>Recent Messages</button>
            <button className={`flex-1 py-2 font-semibold ${tab === 2 ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-600'}`} onClick={() => setTab(2)}>Joined Groups</button>
          </div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default TelegramUserReportPage; 