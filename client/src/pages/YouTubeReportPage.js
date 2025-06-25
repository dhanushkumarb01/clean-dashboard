import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import { youtube } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const YouTubeReportPage = () => {
  const { authorChannelId } = useParams();
  const location = useLocation();
  const fallbackUser = location.state?.user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await youtube.getAuthorReport(authorChannelId);

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
}, [authorChannelId, fallbackUser]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>Loading author report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p>No author data found for this report.</p>
        </div>
      </div>
    );
  }

  const { authorDisplayName, totalComments, commentActivity, totalLikes, averageLikes, maxLikes } = reportData;

  // Dummy data for PieChart if actual like distribution is not available
  // For demonstration, I'll use a simple distribution based on comment counts for now
  const pieChartData = [
    { name: 'Total Comments', value: totalComments },
    { name: 'Other', value: 100 - totalComments } // Placeholder for other data
  ];

  const COLORS = ['#63B3ED', '#90CDF4', '#A0AEC0', '#CBD5E0']; // Professional shades of blue and gray

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col items-center p-6 bg-gray-50 min-h-screen">
        {/* Heading with black background and curvature */}
        <div className="bg-black rounded-xl p-6 mb-8 w-full max-w-4xl shadow-lg">
          <h1 className="text-2xl font-extrabold text-white text-center">YouTube Report for {authorDisplayName.startsWith('@') ? authorDisplayName : `@${authorDisplayName}`}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10 w-full max-w-4xl">
          {/* Author Details Box */}
          <div className="bg-gray-100 rounded-xl shadow p-8 lg:col-span-3 flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Author Details</h2>
            <p className="text-gray-800 font-medium mb-1">Username: {authorDisplayName.startsWith('@') ? authorDisplayName : `@${authorDisplayName}`}</p>
            <p className="text-gray-600">Total Comments: {totalComments}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 w-full max-w-4xl">
          {/* Activity Summary Box */}
          <div className="bg-blue-50 rounded-xl shadow p-8 flex flex-col items-center">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Activity Summary</h2>
            <p className="text-blue-800">Total Likes: {totalLikes}</p>
            <p className="text-blue-800">Average Likes: {averageLikes}</p>
            <p className="text-blue-800">Max Likes: {maxLikes}</p>
            <div className="mt-4 flex-grow w-full" style={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comment Statistics - Line Chart */}
          <div className="bg-green-50 rounded-xl shadow p-8 flex flex-col items-center">
            <h2 className="text-lg font-semibold text-green-900 mb-4">Comment Statistics</h2>
            <div className="flex-grow w-full" style={{ height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={commentActivity} margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="comments" stroke="#4299E1" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeReportPage;
