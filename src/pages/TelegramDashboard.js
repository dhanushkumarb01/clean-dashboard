import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import TelegramMessagesList from '../components/TelegramMessagesList';
import '../styles/TelegramStats.css';

const TelegramDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTelegramStats();
  }, []);

  const fetchTelegramStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/api/telegram/stats');
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch Telegram statistics');
      }
    } catch (err) {
      setError(`Failed to fetch Telegram statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch('/api/telegram/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telegram_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  if (loading) {
    return (
      <div className="telegram-stats-container">
        <div className="telegram-header">
          <div className="header-content">
            <h1 className="main-title">Telegram Analytics</h1>
            <p className="subtitle">Monitor Telegram activity and content</p>
          </div>
        </div>
        
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading Telegram data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="telegram-stats-container">
        <div className="telegram-header">
          <div className="header-content">
            <h1 className="main-title">Telegram Analytics</h1>
            <p className="subtitle">Monitor Telegram activity and content</p>
          </div>
        </div>
        
        <div className="stats-error">
          <div className="error-content">
            <h3>Unable to Load Data</h3>
            <p>{error}</p>
            <button 
              onClick={fetchTelegramStats}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.isEmpty) {
    return (
      <div className="telegram-stats-container">
        <div className="telegram-header">
          <div className="header-content">
            <h1 className="main-title">Telegram Analytics</h1>
            <p className="subtitle">Monitor Telegram activity and content</p>
          </div>
        </div>
        
        <div className="stats-empty">
          <div className="empty-content">
            <h3>No Data Available</h3>
            <p>No Telegram statistics found. Run the data collection script to see analytics.</p>
            <div className="empty-actions">
              <button 
                onClick={fetchTelegramStats}
                className="refresh-button"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-stats-container">
      {/* Header Section */}
      <div className="telegram-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="main-title">Telegram Analytics</h1>
            <p className="subtitle">
              Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="header-actions">
            <button 
              onClick={downloadReport}
              className="download-button"
            >
              📄 Download Report
            </button>
            <button 
              onClick={fetchTelegramStats}
              className="refresh-button"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-content">
              <h3>{stats.totalGroups?.toLocaleString() || 0}</h3>
              <p>Total Groups</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalUsers?.toLocaleString() || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.activeUsers?.toLocaleString() || 0}</h3>
              <p>Active Users</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{stats.totalMessages?.toLocaleString() || 0}</h3>
              <p>Total Messages</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <h3>{stats.totalMediaFiles?.toLocaleString() || 0}</h3>
              <p>Media Files</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.messageRate?.toFixed(1) || 0}</h3>
              <p>Messages/Day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <div className="content-grid">
          
          {/* Most Active Users */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Most Active Users</h2>
              <span className="section-count">
                {stats.mostActiveUsers?.length || 0} users
              </span>
            </div>
            <div className="users-list">
              {stats.mostActiveUsers && stats.mostActiveUsers.length > 0 ? (
                stats.mostActiveUsers.slice(0, 5).map((user, index) => (
                  <div key={user.userId || index} className="user-item">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="user-details">
                        <span className="user-name">
                          {user.username ? `@${user.username}` : 
                           `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                           'Unknown User'}
                        </span>
                        <span className="user-messages">
                          {user.messageCount?.toLocaleString()} messages
                        </span>
                      </div>
                    </div>
                    <div className="user-rank">#{index + 1}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No active users data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Most Active Groups */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Most Active Groups</h2>
              <span className="section-count">
                {stats.mostActiveGroups?.length || 0} groups
              </span>
            </div>
            <div className="groups-list">
              {stats.mostActiveGroups && stats.mostActiveGroups.length > 0 ? (
                stats.mostActiveGroups.slice(0, 5).map((group, index) => (
                  <div key={group.groupId || index} className="group-item">
                    <div className="group-info">
                      <div className="group-avatar">
                        {group.title ? group.title.charAt(0).toUpperCase() : '#'}
                      </div>
                      <div className="group-details">
                        <span className="group-name">
                          {group.title || 'Unknown Group'}
                        </span>
                        <span className="group-stats">
                          {group.messageCount?.toLocaleString()} messages • {group.memberCount?.toLocaleString()} members
                        </span>
                      </div>
                    </div>
                    <div className="group-rank">#{index + 1}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No active groups data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Content Section - NEW */}
          <div className="dashboard-section full-width">
            <TelegramMessagesList />
          </div>

        </div>
      </div>
    </div>
  );
};

export default TelegramDashboard;
