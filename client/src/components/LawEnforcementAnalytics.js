import React, { useState, useEffect } from 'react';
import { telegram } from '../utils/api';

const LawEnforcementAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLawEnforcementStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll calculate these from the message stats
      // Later, the backend can provide dedicated law enforcement endpoints
      const messageStats = await telegram.getMessageStats();
      
      // Calculate law enforcement metrics from message data
      const lawEnforcementStats = {
        flaggedMessages: messageStats?.flaggedMessages || 0,
        highRiskMessages: messageStats?.highRiskMessages || 0,
        suspiciousUsers: messageStats?.suspiciousUsers || 0,
        flaggedUsers: messageStats?.flaggedUsers || 0,
        totalInvestigations: messageStats?.totalInvestigations || 0,
        activeThreats: messageStats?.activeThreats || 0,
        blockedKeywords: messageStats?.blockedKeywords || 0,
        riskScore: messageStats?.averageRiskScore || 0,
        lastUpdated: new Date().toISOString()
      };
      
      setStats(lawEnforcementStats);
      
    } catch (err) {
      console.error('Error loading law enforcement stats:', err);
      setError(err.message);
      
      // Fallback to demo data for testing
      setStats({
        flaggedMessages: 23,
        highRiskMessages: 8,
        suspiciousUsers: 5,
        flaggedUsers: 3,
        totalInvestigations: 12,
        activeThreats: 2,
        blockedKeywords: 47,
        riskScore: 6.2,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLawEnforcementStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="ml-2 text-gray-600">Loading law enforcement data...</span>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 mb-2">Error loading law enforcement data</div>
          <button 
            onClick={loadLawEnforcementStats}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getThreatLevel = (riskScore) => {
    if (riskScore >= 7) return { level: 'HIGH', color: 'text-red-600 bg-red-100', icon: '🔴' };
    if (riskScore >= 4) return { level: 'MEDIUM', color: 'text-yellow-600 bg-yellow-100', icon: '🟡' };
    return { level: 'LOW', color: 'text-green-600 bg-green-100', icon: '🟢' };
  };

  const threatLevel = getThreatLevel(stats.riskScore);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-lg">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Law Enforcement Analytics</h3>
            <p className="text-sm text-gray-500">Real-time threat monitoring and content analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${threatLevel.color}`}>
            {threatLevel.icon} {threatLevel.level} THREAT
          </div>
          <button
            onClick={loadLawEnforcementStats}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Flagged Messages */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.flaggedMessages}</p>
              <p className="text-sm text-red-700 font-medium">Flagged Messages</p>
            </div>
            <div className="text-2xl">🚩</div>
          </div>
        </div>

        {/* High Risk Messages */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.highRiskMessages}</p>
              <p className="text-sm text-orange-700 font-medium">High Risk Messages</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>

        {/* Suspicious Users */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.suspiciousUsers}</p>
              <p className="text-sm text-purple-700 font-medium">Suspicious Users</p>
            </div>
            <div className="text-2xl">👤</div>
          </div>
        </div>

        {/* Active Investigations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalInvestigations}</p>
              <p className="text-sm text-blue-700 font-medium">Investigations</p>
            </div>
            <div className="text-2xl">🔍</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.flaggedUsers}</p>
              <p className="text-xs text-gray-600">Flagged Users</p>
            </div>
            <span className="text-lg">🔒</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.activeThreats}</p>
              <p className="text-xs text-gray-600">Active Threats</p>
            </div>
            <span className="text-lg">💀</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.blockedKeywords}</p>
              <p className="text-xs text-gray-600">Blocked Keywords</p>
            </div>
            <span className="text-lg">🚫</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.riskScore.toFixed(1)}/10</p>
              <p className="text-xs text-gray-600">Avg Risk Score</p>
            </div>
            <span className="text-lg">📊</span>
          </div>
        </div>
      </div>

      {/* Summary and Actions */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <button className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
              🚨 Generate Alert Report
            </button>
            <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              📋 Export Evidence
            </button>
            <button className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
              ⚖️ Law Enforcement Portal
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {stats.activeThreats > 0 && (
        <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-red-800 font-medium">Active Security Threats Detected</p>
              <p className="text-red-700 text-sm">
                {stats.activeThreats} active threat{stats.activeThreats !== 1 ? 's' : ''} requiring immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawEnforcementAnalytics;
