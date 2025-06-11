import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import WhatsAppStatCard from "./WhatsAppStatCard";
import MessagesList from "./MessagesList";
import SendMessageForm from "./SendMessageForm";
import ContactsList from "./ContactsList";
import { whatsapp } from "../../utils/api";

const LoadingState = () => (
  <div className="flex min-h-screen">
    <Sidebar onLogout={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }} />
    <div className="flex-1 p-8">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading WhatsApp Dashboard</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-green-200 animate-pulse"></div>
              Fetching message statistics...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-green-200 animate-pulse"></div>
              Loading contact data...
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 mr-2 rounded-full bg-green-200 animate-pulse"></div>
              Analyzing conversation patterns...
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
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading WhatsApp Data</h3>
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-green-800">No WhatsApp Messages Yet</h3>
        </div>
        <div className="text-green-700 mb-4">
          Your WhatsApp dashboard is ready! Start by sending your first message or configure your WhatsApp Business API to receive messages.
        </div>
        <div className="bg-green-100 p-4 rounded-md text-sm text-green-700 mb-4">
          <p className="font-medium mb-2">To get started:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Configure your WhatsApp Business API credentials</li>
            <li>Set up webhook endpoints for receiving messages</li>
            <li>Send your first message using the form below</li>
          </ul>
        </div>
        <button 
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Refresh Data
        </button>
      </div>
    </div>
  </div>
);

const WhatsAppDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading WhatsApp dashboard data...');
      
      const [statsData, messagesData] = await Promise.all([
        whatsapp.getStats(),
        whatsapp.getRecentMessages(20, 0)
      ]);
      
      console.log('WhatsApp Statistics:', {
        totalMessages: statsData.totalMessages,
        uniqueContacts: statsData.uniqueContacts,
        isEmpty: statsData.isEmpty
      });
      
      setStats(statsData);
      setRecentMessages(messagesData.messages || []);
    } catch (err) {
      console.error('Error loading WhatsApp data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMessageSent = () => {
    // Refresh data when a new message is sent
    refreshData();
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;
  
  // Show the dashboard even if no messages yet, but with empty state elements
  const isEmpty = !stats || stats.isEmpty || stats.totalMessages === 0;

  const statCards = [
    { 
      label: "Total Messages", 
      value: stats.totalMessages?.toLocaleString() || 0,
      icon: "💬",
      color: "green"
    },
    { 
      label: "Messages Sent", 
      value: stats.totalSent?.toLocaleString() || 0,
      icon: "📤",
      color: "blue"
    },
    { 
      label: "Messages Received", 
      value: stats.totalReceived?.toLocaleString() || 0,
      icon: "📥",
      color: "purple"
    },
    { 
      label: "Total Chats", 
      value: stats.totalChats?.toLocaleString() || 0,
      icon: "💬",
      color: "indigo"
    },
    { 
      label: "Unique Contacts", 
      value: stats.uniqueContacts?.toLocaleString() || 0,
      icon: "👥",
      color: "teal"
    },
    { 
      label: "24h Messages", 
      value: stats.messages24h?.toLocaleString() || 0,
      icon: "⏰",
      color: "yellow"
    },
    { 
      label: "7d Messages", 
      value: stats.messages7d?.toLocaleString() || 0,
      icon: "📅",
      color: "pink"
    },
    { 
      label: "Delivery Rate", 
      value: `${stats.deliveryRate || 0}%`,
      icon: "✅",
      color: "emerald"
    },
    { 
      label: "Avg Response Time", 
      value: `${stats.averageResponseTime || 0}m`,
      icon: "⚡",
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
              <h1 className="text-2xl font-bold text-gray-800">WhatsApp Business Dashboard</h1>
              <div className="flex items-center mt-1 space-x-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{stats?.businessProfile?.verifiedName || stats?.businessProfile?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    📱 {stats?.businessProfile?.displayPhoneNumber || stats?.businessProfile?.phoneNumber}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {stats?.apiConnected ? 'API Connected' : 'Limited Access'}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {stats?.businessProfile?.status || 'VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <WhatsAppStatCard key={stat.label} {...stat} />
            ))}
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Send Message Form */}
            <div className="lg:col-span-1">
              <SendMessageForm onMessageSent={handleMessageSent} />
            </div>
            
            {/* Recent Messages */}
            <div className="lg:col-span-1">
              <MessagesList messages={recentMessages} onRefresh={refreshData} />
            </div>
            
            {/* Active Contacts */}
            <div className="lg:col-span-1 xl:col-span-1">
              <ContactsList contacts={stats.mostActiveContacts || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDashboard;
