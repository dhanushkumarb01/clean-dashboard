import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import FilterDropdown from "../components/FilterDropdown/FilterDropdown";
import StatCard from "../components/StatCard/StatCard";
import UserList from "../components/UserList/UserList";
import ChannelList from "../components/ChannelList/ChannelList";
import { youtube } from "../utils/api";
import YouTubeConnect from '../components/YouTubeConnect';

const LoadingState = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 p-8">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading YouTube Analytics</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Searching channels...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Fetching statistics...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-200 animate-pulse"></div>
              Processing data...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => {
  const isQuotaError = error && (error.toLowerCase().includes('quota') || error.toLowerCase().includes('429'));
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Data</h3>
          </div>
          <div className="text-red-700 mb-4">
            {isQuotaError
              ? 'YouTube data temporarily unavailable due to API quota limits. Please try again after the quota resets (midnight Pacific Time).'
              : error}
          </div>
          {isQuotaError ? (
            <div className="bg-red-100 p-4 rounded-md text-sm text-red-700 mb-4">
              <p className="font-medium mb-2">Why am I seeing this?</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>The YouTube API has a daily quota limit</li>
                <li>This limit has been reached for today</li>
                <li>The quota resets at midnight Pacific Time</li>
              </ul>
            </div>
          ) : null}
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
};

const DashboardPage = () => {
  const [filter, setFilter] = useState("all");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quota, setQuota] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);      const [data, quotaData] = await Promise.all([
        youtube.fetchOverview(),
        youtube.getQuotaUsage()
      ]);
      setOverview(data);
      setQuota(quotaData.quotaUsage);
    } catch (err) {
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
  if (!overview) return null;

  const stats = [
    { label: "Total Channels", value: overview.totalChannels },
    { label: "Total Comments", value: overview.totalComments },
    { label: "Unique Authors", value: overview.uniqueCommentAuthors },
    { label: "Avg. Comments/Day", value: overview.avgCommentsPerDay },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">YouTube Analytics Dashboard</h1>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500">API Quota Used: {quota} units</p>
                {quota > 8000 && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Quota Warning
                  </span>
                )}
              </div>
            </div>
            <FilterDropdown value={filter} onChange={setFilter} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>          {overview.mostActiveUsers && overview.mostActiveChannels && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserList users={overview.mostActiveUsers} />
              <ChannelList channels={overview.mostActiveChannels} />
            </div>
          )}

          <YouTubeConnect />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;