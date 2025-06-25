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
            <div className="font-semibold mb-2">AI Analysis (placeholder)</div>
            <div className="mb-1">Risk: <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">{userDetails.risk || 'Unknown'}</span></div>
            <div>Last Active: {userDetails.lastActive ? new Date(userDetails.lastActive).toLocaleString() : '-'}</div>
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
          <div className="p-4 text-center text-gray-500">Joined Groups feature coming soon.</div>
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-yellow-300 to-blue-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg mr-6">
              {userDetails?.firstName ? userDetails.firstName[0].toUpperCase() : (userDetails?.username ? userDetails.username[0].toUpperCase() : 'U')}
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-700">{userDetails?.firstName} {userDetails?.lastName}</div>
              <div className="text-md text-blue-700 font-semibold">@{userDetails?.username || 'N/A'}</div>
              <div className="text-md text-yellow-700 font-mono">Telegram ID: {userDetails?.telegramId || currentId}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-cyan-200 rounded-lg shadow-lg p-6">
            <div className="text-lg font-semibold text-cyan-800 mb-2">Total Messages</div>
            <div className="text-4xl font-extrabold text-cyan-700">{userDetails?.messageCount?.toLocaleString() || '0'}</div>
          </div>
          <div className="bg-pink-200 rounded-lg shadow-lg p-6">
            <div className="text-lg font-semibold text-pink-800 mb-2">Groups</div>
            <div className="text-3xl font-bold text-pink-700">{userDetails?.groupCount || 0}</div>
            <div className="text-xs text-blue-700 mt-1 font-semibold">Last Active: {userDetails?.lastActive ? new Date(userDetails.lastActive).toLocaleString() : '-'}</div>
          </div>
        </div>
        <div className="bg-blue-100 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-700">Full Name:</span>
                <span className="text-sm text-blue-900 font-bold">{userDetails?.firstName && userDetails?.lastName ? `${userDetails.firstName} ${userDetails.lastName}` : userDetails?.firstName || userDetails?.lastName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-pink-700">Username:</span>
                <span className="text-sm text-pink-900 font-bold">{userDetails?.username ? `@${userDetails.username}` : 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-700">Bio:</span>
                <span className="text-sm text-green-900">{userDetails?.bio || '-'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-yellow-700">Telegram ID:</span>
                <span className="text-sm text-yellow-900 font-mono font-bold">{userDetails?.telegramId || currentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-blue-700">Activity Level:</span>
                <span className="text-sm text-blue-900">{userDetails?.activityLevel || '-'}</span>
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