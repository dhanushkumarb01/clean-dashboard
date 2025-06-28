import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TelegramStatCard from "./TelegramStatCard";
import MostActiveUsersList from "./MostActiveUsersList";
import MostActiveGroupsList from "././MostActiveGroupsList";
import TelegramMessagesList from "../../components/TelegramMessagesList";
import LawEnforcementAnalytics from "../../components/LawEnforcementAnalytics";
import { telegram } from "../../utils/api";
import api from '../../utils/api';
// Enhanced Analytics and Location Intelligence Components - temporarily disabled while creating proper directory structure
// import EnhancedAnalytics from "../../components/EnhancedAnalytics";
// import LocationIntelligence from "../../components/LocationIntelligence";

// Temporary placeholder components

const EnhancedAnalytics = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-center text-gray-500 py-8">
      <div className="text-4xl mb-4">📊</div>
      <p className="text-lg font-medium">Enhanced Analytics</p>
      <p className="text-sm mt-2">Advanced metrics and keyword analysis loading...</p>
    </div>
  </div>
);

const LocationIntelligence = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-center text-gray-500 py-8">
      <div className="text-4xl mb-4">🌍</div>
      <p className="text-lg font-medium">Location Intelligence</p>
      <p className="text-sm mt-2">Geographic distribution analysis loading...</p>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
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
);

const ErrorState = ({ error, onRetry }) => (
  <div className="p-8">
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
);

const EmptyState = ({ onRetry }) => (
  <div className="p-8">
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
);

const TelegramDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [mostActiveGroups, setMostActiveGroups] = useState([]);
  const [messagesData, setMessagesData] = useState(null);

  // Telegram login state
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(localStorage.getItem('telegramPhone') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  // Ensure phone is always loaded from localStorage on mount
  useEffect(() => {
    if (!phone) {
      const storedPhone = localStorage.getItem('telegramPhone');
      if (storedPhone) setPhone(storedPhone);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("telegramPhone");
    setPhone('');
    setStats(null);
    setMostActiveUsers([]);
    setMostActiveGroups([]);
    setMessagesData(null);
    setStep(1);
    setOtp('');
    setPassword('');
    setPhoneCodeHash('');
    setLoginSuccess(false);
    setError(null);
    setLoading(false);
    setShowDashboard(false);
    navigate("/login");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!phone) throw new Error('No phone number found. Please login.');
      
      console.log('TelegramDashboard: Loading data for phone:', phone);
      
      const [statsData, usersData, groupsData, messagesData] = await Promise.all([
        telegram.getStats(phone),
        telegram.getMostActiveUsers(phone),
        telegram.getMostActiveGroups(phone),
        telegram.getMessages({ phone, page: 1, limit: 50 })
      ]);
      
      console.log('TelegramDashboard: Received data:', {
        statsData,
        usersData,
        groupsData,
        messagesData
      });
      
      if (!statsData || statsData.isEmpty) {
        console.log('TelegramDashboard: No stats data found, going back to login');
        // No data, go back to login form
        setShowDashboard(false);
        setStats(null);
        setMostActiveUsers([]);
        setMostActiveGroups([]);
        setStep(1);
        return;
      }
      
      console.log('TelegramDashboard: Setting data to state:', {
        statsData,
        usersDataLength: usersData ? usersData.length : 'null',
        groupsDataLength: groupsData ? groupsData.length : 'null',
        messagesDataLength: messagesData ? messagesData.messages?.length : 'null'
      });
      
      setStats(statsData);
      setMostActiveUsers(usersData || []);
      setMostActiveGroups(groupsData || []);
      setMessagesData(messagesData);
      setShowDashboard(true);
    } catch (err) {
      console.error('TelegramDashboard: Error loading data:', err);
      setError(err.message);
      setShowDashboard(false);
      setStats(null);
      setMostActiveUsers([]);
      setMostActiveGroups([]);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/telegram/report', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Telegram_Analytics_Report.pdf';
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download Telegram report:", err);
    }
  };

  // Add this helper function for polling
  const pollForStats = async (phone, onReady, onError, maxWait = 300000, interval = 5000) => {
    const start = Date.now();
    setLoading(true);
    setError(null);
    let found = false;
    while (Date.now() - start < maxWait) {
      try {
        const statsData = await telegram.getStats(phone);
        if (statsData && !statsData.isEmpty) {
          found = true;
          // Also fetch messages data when stats are ready
          try {
            const messagesData = await telegram.getMessages({ phone, page: 1, limit: 50 });
            onReady(statsData, messagesData);
          } catch (messagesErr) {
            console.error('Error fetching messages:', messagesErr);
            // Still call onReady with just stats if messages fail
            onReady(statsData, null);
          }
          break;
        }
      } catch (err) {
        // Ignore errors during polling, only show error if timeout
      }
      await new Promise(res => setTimeout(res, interval));
    }
    setLoading(false);
    if (!found) {
      onError('Timeout: Data collection took too long. Please try again.');
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      // First, check if stats exist for this phone
      setLoading(true);
      setError(null);
      let statsData = null;
      try {
        statsData = await telegram.getStats(phone);
      } catch (err) {
        // Ignore error, may mean no data
      }
      if (statsData && !statsData.isEmpty) {
        setStats(statsData);
        // Also fetch messages data
        try {
          const messagesData = await telegram.getMessages({ phone, page: 1, limit: 50 });
          setMessagesData(messagesData);
        } catch (messagesErr) {
          console.error('Error fetching messages:', messagesErr);
          setMessagesData(null);
        }
        setShowDashboard(true);
        setStep(3);
        setLoading(false);
        setLoginLoading(false);
        return;
      }
      setLoading(false);
      // If no stats, proceed to request-login as before
      const res = await api.post('/api/telegram/request-login', { phone });
      if (res.data.status === 'ready') {
        setShowDashboard(false);
        localStorage.setItem('telegramPhone', phone);
        // Start polling for stats
        pollForStats(
          phone,
          (statsData, messagesData) => {
            setStats(statsData);
            setShowDashboard(true);
            setStep(3);
            setMessagesData(messagesData);
          },
          (errMsg) => {
            setError(errMsg);
            setShowDashboard(false);
            setStep(1);
          }
        );
      } else if (res.data.status === 'otp_sent' || res.data.success) {
        setStep(2);
        setPhoneCodeHash(res.data.phone_code_hash);
        localStorage.setItem('telegramPhone', phone);
      } else {
        setLoginError(res.data.error || 'Failed to send code');
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/api/telegram/verify-login', { phone, code: otp, phone_code_hash: phoneCodeHash, password });
      if (res.data.status === 'ready' || res.data.success) {
        setLoginSuccess(true);
        setStep(3);
        // Start polling for stats
        pollForStats(
          phone,
          (statsData, messagesData) => {
            setLoginSuccess(false);
            setStats(statsData);
            setShowDashboard(true);
            setMessagesData(messagesData);
          },
          (errMsg) => {
            setError(errMsg);
            setShowDashboard(false);
            setStep(1);
          }
        );
      } else {
        setLoginError(res.data.error || 'Failed to verify');
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Only show login form until data is loaded and dashboard is ready
  if (!showDashboard) {
    return (
      <div className="p-6">
        <div className="mb-8 max-w-lg mx-auto">
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Enter your Telegram number</h2>
              <input
                type="text"
                className="border rounded px-3 py-2"
                placeholder="e.g. +1234567890"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2" disabled={loginLoading}>
                {loginLoading ? 'Sending code...' : 'Send Code'}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyLogin} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Enter the OTP sent to your Telegram</h2>
              <input
                type="text"
                className="border rounded px-3 py-2"
                placeholder="Verification code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
              <input
                type="password"
                className="border rounded px-3 py-2"
                placeholder="2FA password (if enabled)"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}
              <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2" disabled={loginLoading}>
                {loginLoading ? 'Verifying...' : 'Verify & Fetch Data'}
              </button>
            </form>
          )}
          {step === 3 && loginSuccess && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-green-800 font-semibold">Login successful! Fetching your Telegram data...</div>
              <div className="text-green-700 text-sm mt-2">This may take a few seconds. The dashboard will refresh automatically.</div>
            </div>
          )}
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={loadData} />}
      </div>
    );
  }

  // After successful login and data fetch, show dashboard
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

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
      value: `${stats.rateChange?.toFixed(2) || 0}%`,
      icon: "📉",
      color: "red"
    },
    { 
      label: "Group Propagation", 
      value: `${stats.groupPropagation?.toFixed(2) || 0}%`,
      icon: "🌐",
      color: "orange"
    },
    { 
      label: "Avg Views/Message", 
      value: stats.avgViewsPerMessage?.toLocaleString() || 0,
      icon: "👁️",
      color: "cyan"
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Telegram Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time analytics from your Telegram groups and channels</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadReport}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md shadow-sm"
          >
            📄 Generate Telegram Report
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <TelegramStatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mb-8">
        <TelegramMessagesList messages={messagesData} />
      </div>
      <div className="mb-8">
        <LawEnforcementAnalytics />
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">👥 User & Group Activity</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MostActiveUsersList users={mostActiveUsers} />
          <MostActiveGroupsList groups={mostActiveGroups} />
        </div>
      </div>
    </div>
  );
};

export default TelegramDashboard;
