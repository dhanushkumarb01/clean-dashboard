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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 text-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-pink-500 py-6 px-4 text-white text-center shadow-lg rounded-b-2xl">
        <h1 className="text-4xl font-extrabold mb-1 tracking-tight drop-shadow-lg">YouTube Report</h1>
        <p className="text-lg text-blue-100 font-medium">Enter a YouTube author to generate a report</p>
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
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Author Details Card */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold text-indigo-700 mb-2 flex items-center gap-2">
                <span className="inline-block">🧑‍💻</span> Author Details
              </h2>
              <div className="mb-1"><span className="font-semibold text-blue-700">Username:</span> <span className="text-gray-900">@{reportData.authorDisplayName?.replace(/^@/, '') || '-'}</span></div>
              <div className="mb-1"><span className="font-semibold text-blue-700">Channel ID:</span> <span className="text-gray-900">{reportData.authorChannelId || '-'}</span></div>
              <div><span className="font-semibold text-blue-700">Total Comments:</span> <span className="text-gray-900">{reportData.totalComments}</span></div>
              <div className="mt-4">
                <div className="font-semibold mb-1 text-indigo-700">User's Comments:</div>
                <div className="max-h-40 overflow-y-auto border border-indigo-100 rounded p-2 bg-blue-50">
                  {reportData.userComments && reportData.userComments.length > 0 ? reportData.userComments.map((comment, idx) => (
                    <div key={comment.id || idx} className="mb-2 pb-2 border-b border-indigo-100 last:border-b-0">
                      <div className="text-gray-900 font-medium">{comment.textDisplay || comment.text || 'No text'}</div>
                      <div className="text-xs text-pink-600">
                        {comment.date ? `Date: ${new Date(comment.date).toLocaleString()}` : ''}
                        {comment.userId ? ` | User ID: ${comment.userId}` : ''}
                        {comment.channelId ? ` | Channel ID: ${comment.channelId}` : ''}
                        {comment.videoId ? ` | Video: ${comment.videoId}` : ''}
                      </div>
                    </div>
                  )) : <div className="text-gray-500">No comments found for this user.</div>}
                </div>
              </div>
            </div>
            {/* Activity Summary Card */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-pink-100 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold text-pink-600 mb-2 flex items-center gap-2">
                <span className="inline-block">📈</span> Activity Summary
              </h2>
              <div className="mb-1"><span className="font-semibold text-indigo-700">Total Likes:</span> <span className="text-pink-600 font-bold">{reportData.totalLikes}</span></div>
              <div className="mb-1"><span className="font-semibold text-indigo-700">Average Likes:</span> <span className="text-pink-600 font-bold">{reportData.averageLikes}</span></div>
              <div><span className="font-semibold text-indigo-700">Max Likes:</span> <span className="text-pink-600 font-bold">{reportData.maxLikes}</span></div>
            </div>
          </div>
          {/* Charts */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">Comment Statistics</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" />
                  <XAxis dataKey="name" stroke="#6366f1" />
                  <YAxis allowDecimals={false} stroke="#6366f1" />
                  <Tooltip contentStyle={{ background: '#f1f5f9', border: '1px solid #c7d2fe', color: '#1e293b' }} />
                  <Bar dataKey="value" fill="#6366f1">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border-2 border-pink-100">
              <h3 className="text-lg font-semibold mb-2 text-pink-600">Comment Statistics</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#f1f5f9', border: '1px solid #fbcfe8', color: '#1e293b' }} />
                  <Legend wrapperStyle={{ color: '#be185d' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeReportPage;
