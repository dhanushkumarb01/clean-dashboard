import React, { useState, useEffect } from 'react';
import { youtube } from '../utils/api';

const YouTubeLawEnforcementAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await youtube.getThreatStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
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

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 mb-2">Error loading law enforcement data</div>
          <button onClick={loadStats} className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">Retry</button>
        </div>
      </div>
    );
  }

  const getThreatLevel = (riskScore) => {
    if (riskScore >= 7) return { level: 'HIGH', color: 'text-red-600 bg-red-100', icon: '🔴' };
    if (riskScore >= 4) return { level: 'MEDIUM', color: 'text-yellow-600 bg-yellow-100', icon: '🟡' };
    return { level: 'LOW', color: 'text-green-600 bg-green-100', icon: '🟢' };
  };

  const threatLevel = getThreatLevel(stats.avgRiskScore);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-lg">🚨</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Law Enforcement Analytics (YouTube)</h3>
            <p className="text-sm text-gray-500">Real-time threat monitoring and content analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${threatLevel.color}`}>
            {threatLevel.icon} {threatLevel.level} THREAT
          </div>
          <button onClick={loadStats} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded">🔄 Refresh</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.flaggedComments}</p>
              <p className="text-sm text-red-700 font-medium">Flagged Comments</p>
            </div>
            <div className="text-2xl">🚩</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.highRiskComments}</p>
              <p className="text-sm text-orange-700 font-medium">High Risk Comments</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.safe}</p>
              <p className="text-sm text-green-700 font-medium">Safe Comments</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalComments}</p>
              <p className="text-sm text-blue-700 font-medium">Total Comments</p>
            </div>
            <div className="text-2xl">💬</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.mediumRiskComments}</p>
              <p className="text-xs text-gray-600">Medium Risk</p>
            </div>
            <span className="text-lg">🟡</span>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.lowRiskComments}</p>
              <p className="text-xs text-gray-600">Low Risk</p>
            </div>
            <span className="text-lg">🟢</span>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.fraud}</p>
              <p className="text-xs text-gray-600">Fraudulent</p>
            </div>
            <span className="text-lg">🚨</span>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-700">{stats.sensitive}</p>
              <p className="text-xs text-gray-600">Sensitive</p>
            </div>
            <span className="text-lg">🔒</span>
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Avg Risk Score: {stats.avgRiskScore?.toFixed(2)}/10</div>
          <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">📋 Export Evidence</button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeLawEnforcementAnalytics; 