import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { youtube } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3182ce', '#63b3ed', '#90cdf4', '#e53e3e', '#ecc94b', '#38a169'];

const YouTubeReportPage = () => {
  const { authorChannelId: routeAuthorChannelId } = useParams();
  const location = useLocation();
  const fallbackUser = location.state?.user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState(0);
  const [author, setAuthor] = useState('');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await youtube.getAuthorReport(routeAuthorChannelId);

        if (data) {
          setReportData(data);
        } else if (fallbackUser) {
          // Use fallback user if API returns null
          setReportData({
            authorDisplayName: fallbackUser.authorDisplayName || 'Unknown User',
            totalComments: fallbackUser.totalComments || 0,
            commentActivity: [],
            totalLikes: 0,
            averageLikes: 0,
            maxLikes: 0
          });
        } else {
          // Fallback to default unknown user
          setReportData({
            authorDisplayName: 'Unknown User',
            totalComments: 0,
            commentActivity: [],
            totalLikes: 0,
            averageLikes: 0,
            maxLikes: 0
          });
        }
      } catch (err) {
        console.error('Error fetching YouTube report:', err);
        if (fallbackUser) {
          setReportData({
            authorDisplayName: fallbackUser.authorDisplayName || 'Unknown User',
            totalComments: fallbackUser.totalComments || 0,
            commentActivity: [],
            totalLikes: 0,
            averageLikes: 0,
            maxLikes: 0
          });
        } else {
          setReportData({
            authorDisplayName: 'Unknown User',
            totalComments: 0,
            commentActivity: [],
            totalLikes: 0,
            averageLikes: 0,
            maxLikes: 0
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [routeAuthorChannelId, fallbackUser]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await youtube.getAuthorReport(author.replace(/^@/, ''));
      setReportData(data);
    } catch (err) {
      setError('No data found for this author.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Dummy chart data fallback
  const barData = reportData ? [
    { name: 'Total Likes', value: reportData.totalLikes || 0 },
    { name: 'Average Likes', value: reportData.averageLikes || 0 },
    { name: 'Max Likes', value: reportData.maxLikes || 0 },
    { name: 'Total Comments', value: reportData.totalComments || 0 },
  ] : [];
  const pieData = reportData ? [
    { name: 'Total Likes', value: reportData.totalLikes || 0 },
    { name: 'Average Likes', value: reportData.averageLikes || 0 },
    { name: 'Max Likes', value: reportData.maxLikes || 0 },
    { name: 'Total Comments', value: reportData.totalComments || 0 },
  ] : [];

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>Loading author report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>No author data found for this report.</p>
        </div>
      </div>
    );
  }

  const { authorDisplayName, authorChannelId: reportAuthorChannelId, totalComments, commentActivity, totalLikes, averageLikes, maxLikes, userSummary } = reportData;

  // Tab content renderer
  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return (
          <div className="p-4">
            <div className="font-semibold mb-4 text-lg">AI Analysis</div>
            
            {/* AI Summary */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Summary</div>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-800 leading-relaxed">
                {reportData.aiAnalysis?.summary || 'No analysis available.'}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Risk Assessment</div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Risk Level:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  reportData.aiAnalysis?.scamRisk === 'High' ? 'bg-red-100 text-red-700' :
                  reportData.aiAnalysis?.scamRisk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {reportData.aiAnalysis?.scamRisk === 'High' ? 'High Risk' :
                   reportData.aiAnalysis?.scamRisk === 'Medium' ? 'Medium Risk' : 'Low Risk'}
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
                    {reportData.aiAnalysis?.sentimentBreakdown?.positive || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-700">Negative</div>
                  <div className="text-lg font-bold text-red-800">
                    {reportData.aiAnalysis?.sentimentBreakdown?.negative || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Neutral</div>
                  <div className="text-lg font-bold text-gray-800">
                    {reportData.aiAnalysis?.sentimentBreakdown?.neutral || 0}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Overall Sentiment: <span className="font-medium">{reportData.aiAnalysis?.sentiment || 'Neutral'}</span>
              </div>
            </div>

            {/* Scam Detection */}
            {reportData.aiAnalysis?.scamKeywords && reportData.aiAnalysis.scamKeywords.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Detected Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {reportData.aiAnalysis.scamKeywords.slice(0, 8).map((keyword, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                  {reportData.aiAnalysis.scamKeywords.length > 8 && (
                    <span className="text-xs text-gray-500">
                      +{reportData.aiAnalysis.scamKeywords.length - 8} more
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
                  <div className="text-sm font-medium text-blue-700">Comments Analyzed</div>
                  <div className="text-lg font-bold text-blue-800">
                    {reportData.aiAnalysis?.totalMessagesAnalyzed || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-orange-700">Suspicious Comments</div>
                  <div className="text-lg font-bold text-orange-800">
                    {reportData.aiAnalysis?.scamMessageCount || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="p-4">
            <div className="font-semibold mb-2">Recent Comments</div>
            <ul className="divide-y">
              {reportData.userComments && reportData.userComments.length > 0 ? reportData.userComments.slice(0, 10).map((comment, idx) => (
                <li key={comment.id || idx} className="py-2">
                  <div className="text-gray-800">{comment.textDisplay || comment.text || 'No text'}</div>
                  <div className="text-xs text-gray-500">
                    {comment.date ? `Date: ${new Date(comment.date).toLocaleString()}` : ''}
                    {comment.videoId ? ` | Video: ${comment.videoId}` : ''}
                  </div>
                </li>
              )) : <div>No recent comments.</div>}
            </ul>
          </div>
        );
      case 2:
        return (
          <div className="p-4">
            <div className="font-semibold mb-2">Comment Activity</div>
            <div className="text-sm text-gray-600">
              {reportData.commentActivity && reportData.commentActivity.length > 0 ? (
                <div className="space-y-2">
                  {reportData.commentActivity.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{activity.date}</span>
                      <span className="font-medium">{activity.comments} comments</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No activity data available.</div>
              )}
            </div>
          </div>
        );
      default:
        return <div className="p-4">Select a tab to view content.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 text-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-pink-500 py-6 px-4 text-white text-center shadow-lg rounded-b-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">YouTube Report</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
        <p className="text-lg text-blue-100 font-medium">Author Analysis Report</p>
      </div>
      {/* Search Bar */}
      <div className="flex flex-col items-center mt-8">
        <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-4 py-2 border-2 border-indigo-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-400 shadow-sm"
            placeholder="Author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-pink-500 via-indigo-500 to-blue-500 text-white rounded-md font-bold hover:from-pink-600 hover:to-blue-600 transition-colors shadow-lg"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </form>
        {error && <div className="text-red-500 mb-4 font-semibold">{error}</div>}
      </div>
      {/* Report Content */}
      {reportData && (
        <div className="w-full max-w-5xl mx-auto mt-4">
          {/* Author Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100 mb-6">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg mr-6">
                {reportData.authorDisplayName ? reportData.authorDisplayName[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{reportData.authorDisplayName}</h2>
                <p className="text-md text-gray-600">Channel ID: {reportData.authorChannelId}</p>
                <p className="text-md text-gray-600">Total Comments: {reportData.totalComments}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-lg font-semibold mb-2">Total Comments</div>
              <div className="text-4xl font-extrabold">{reportData.totalComments}</div>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-lg font-semibold mb-2">Total Likes</div>
              <div className="text-4xl font-extrabold">{reportData.totalLikes}</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-lg font-semibold mb-2">Average Likes</div>
              <div className="text-4xl font-extrabold">{reportData.averageLikes}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100">
            <div className="flex border-b">
              <button 
                className={`flex-1 py-3 font-semibold ${tab === 0 ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-600 hover:text-gray-800'}`} 
                onClick={() => setTab(0)}
              >
                AI Analysis
              </button>
              <button 
                className={`flex-1 py-3 font-semibold ${tab === 1 ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-600 hover:text-gray-800'}`} 
                onClick={() => setTab(1)}
              >
                Recent Comments
              </button>
              <button 
                className={`flex-1 py-3 font-semibold ${tab === 2 ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-600 hover:text-gray-800'}`} 
                onClick={() => setTab(2)}
              >
                Comment Activity
              </button>
            </div>
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeReportPage;
