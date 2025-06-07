import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import FilterDropdown from "../components/FilterDropdown/FilterDropdown";
import StatCard from "../components/StatCard/StatCard";
import UserList from "../components/UserList/UserList";
import ChannelList from "../components/ChannelList/ChannelList";
import { fetchDashboard } from "../utils/api";
import TelegramDashboardSection from "../components/Sections/TelegramDashboardSection";

const TABS = [
  { label: "YouTube", value: "youtube" },
  { label: "Telegram", value: "telegram" },
];

const LoadingState = () => (
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
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center h-full">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Data</h3>
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
);

const DashboardPage = () => {
  const [filter, setFilter] = useState("all");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("youtube");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "youtube") {
      loadData();
    }
    // No backend call for Telegram tab
    // eslint-disable-next-line
  }, [tab]);

  const stats = dashboard && [
    { label: "Total Channels", value: dashboard.totalChannels },
    { label: "Total Comments", value: dashboard.totalComments },
    { label: "Unique Authors", value: dashboard.uniqueAuthors },
    { label: "Avg. Comments/Day", value: dashboard.avgCommentsPerDay },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <div className="p-6 h-full">
          {/* Tab Switcher */}
          <div className="flex items-center mb-6 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.value}
                className={`px-4 py-2 text-lg font-semibold focus:outline-none transition border-b-2 ${tab === t.value ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-600"}`}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* YouTube Section (untouched) */}
          {tab === "youtube" && (
            loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={loadData} /> : dashboard && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UserList users={dashboard.mostActiveUsers} />
                  <ChannelList channels={dashboard.mostActiveChannels} />
                </div>
              </>
            )
          )}

          {/* Telegram Section (dummy, static) */}
          {tab === "telegram" && <TelegramDashboardSection />}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;