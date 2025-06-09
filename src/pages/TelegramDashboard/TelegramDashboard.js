import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import StatCard from "../../components/StatCard/StatCard";
import TelegramStatCard from "./TelegramStatCard";
import MostActiveUsersList from "./MostActiveUsersList";
import MostActiveGroupsList from "./MostActiveGroupsList";
import TopUsersByGroupsList from "./TopUsersByGroupsList";
import { telegram } from "../../utils/api";

const LoadingState = () => (
  <div className="flex min-h-screen">
    <Sidebar onLogout={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }} />
    <div className="flex-1 p-8">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Telegram Analytics</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Fetching group statistics...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Processing user data...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Analyzing message patterns...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex min-h-screen">
    <Sidebar onLogout={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }} />
    <div className="flex-1 p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Telegram Data</h3>
        </div>
        <div className="text-red-700 mb-4">{error}</div>
        <button 
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ onRetry }) => (
  <div className="flex min-h-screen">
    <Sidebar onLogout={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }} />
    <div className="flex-1 p-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-blue-800">No Telegram Data Available</h3>
        </div>
        <div className="text-blue-700 mb-4">
          Telegram statistics haven't been collected yet. The data collection script needs to be run to gather statistics from your Telegram groups and channels.
        </div>
        <div className="bg-blue-100 p-4 rounded-md text-sm text-blue-700 mb-4">
          <p className="font-medium mb-2">To get started:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Set up your Telegram API credentials</li>
            <li>Run the Python statistics collection script</li>
            <li>Configure the cron job for automatic updates</li>
          </ul>
        </div>
        <button 
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh Data
        </button>
      </div>
    </div>
  </div>
);

const TelegramDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [mostActiveGroups, setMostActiveGroups] = useState([]);
  const [topUsersByGroups, setTopUsersByGroups] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading Telegram dashboard data...');
      
      const [statsData, usersData, groupsData, topUsersData] = await Promise.all([
        telegram.getStats(),
        telegram.getMostActiveUsers(),
        telegram.getMostActiveGroups(),
        telegram.getTopUsersByGroups()
      ]);
      
      console.log('Telegram Statistics:', {
        totalGroups: statsData.totalGroups,
        totalMessages: statsData.totalMessages,
        activeUsers: statsData.activeUsers
      });
      
      setStats(statsData);
      setMostActiveUsers(usersData);
      setMostActiveGroups(groupsData);
      setTopUsersByGroups(topUsersData);
    } catch (err) {
      console.error('Error loading Telegram data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;
  if (!stats || stats.isEmpty) return <EmptyState onRetry={loadData} />;

  const statCards = [
    { 
      label: "Total Groups", 
      value: stats.totalGroups?.toLocaleString() || 0,
      icon: "📱",
      color: "blue"
    },
    { 
      label: "Active Users", 
      value: stats.activeUsers?.toLocaleString() || 0,
      icon: "👥",
      color: "green"
    },
    { 
      label: "Total Users", 
      value: stats.totalUsers?.toLocaleString() || 0,
      icon: "👤",
      color: "purple"
    },
    { 
      label: "Total Messages", 
      value: stats.totalMessages?.toLocaleString() || 0,
      icon: "💬",
      color: "indigo"
    },
    { 
      label: "Total Media Files", 
      value: stats.totalMediaFiles?.toLocaleString() || 0,
      icon: "📎",
      color: "pink"
    },
    { 
      label: "Message Rate", 
      value: `${stats.messageRate || 0}/day`,
      icon: "📈",
      color: "yellow"
    },
    { 
      label: "Rate Change", 
      value: `${stats.rateChange || 0}%`,
      icon: "📊",
      color: "red"
    },
    { 
      label: "Group Propagation", 
      value: `${stats.groupPropagation || 0}%`,
      icon: "🌐",
      color: "teal"
    },
    { 
      label: "Avg Views/Message", 
      value: stats.avgViewsPerMessage || 0,
      icon: "👁️",
      color: "orange"
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Telegram Analytics Dashboard</h1>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500">
                  Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
                </p>
                {stats.collectionPeriod && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {new Date(stats.collectionPeriod.start).toLocaleDateString()} - {new Date(stats.collectionPeriod.end).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => loadData()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Stats
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {statCards.map((stat) => (
              <TelegramStatCard key={stat.label} {...stat} />
            ))}
          </div>
          
          {/* Lists Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <MostActiveUsersList users={mostActiveUsers} />
            <MostActiveGroupsList groups={mostActiveGroups} />
            <TopUsersByGroupsList users={topUsersByGroups} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramDashboard; 