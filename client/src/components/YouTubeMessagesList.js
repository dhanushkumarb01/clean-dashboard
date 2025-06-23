import React, { useState, useEffect } from 'react';
import { youtube } from '../utils/api';

const PAGE_SIZE = 50;

const YouTubeMessagesList = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    flagged: '',
    riskScore: '',
    page: 1
  });

  // For UI-only flagging (no backend integration yet)
  const [localFlags, setLocalFlags] = useState({});

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await youtube.getMessageAnalysis();
      const allMessages = [
        ...(response.categories?.safe || []),
        ...(response.categories?.fraud || []),
        ...(response.categories?.sensitive || []),
        ...(response.categories?.spam || []),
        ...(response.categories?.other || []),
        ...(response.categories?.flagged || []),
        ...(response.categories?.highRisk || []),
        ...(response.categories?.mediumRisk || []),
        ...(response.categories?.lowRisk || [])
      ];
      const uniqueMessages = Array.from(new Map(allMessages.map(msg => [msg._id || msg.commentId, msg])).values());
      setMessages(uniqueMessages);
    } catch (err) {
      console.error('Error loading YouTube messages:', err);
      setError(err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagMessage = (id, flagged) => {
    // UI only: update localFlags
    setLocalFlags(prev => ({ ...prev, [id]: flagged }));
    // TODO: Integrate with backend when available
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getRiskScoreColor = (score) => {
    if (score >= 7) return 'text-red-600 bg-red-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getRiskScoreLabel = (score) => {
    if (score >= 7) return 'High Risk';
    if (score >= 4) return 'Medium Risk';
    return 'Low Risk';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Filtering
  const filteredMessages = messages.filter(comment => {
    // Flagged filter
    const localFlag = localFlags[comment._id || comment.commentId];
    const isFlagged = typeof localFlag === 'boolean' ? localFlag : comment.isFlagged;
    if (filters.flagged === 'true' && !isFlagged) return false;
    if (filters.flagged === 'false' && isFlagged) return false;
    // Risk score filter
    if (filters.riskScore !== '') {
      const score = comment.riskScore || 0;
      if (filters.riskScore === '7' && score < 7) return false;
      if (filters.riskScore === '4' && (score < 4 || score >= 7)) return false;
      if (filters.riskScore === '0' && score >= 4) return false;
    }
    return true;
  });

  // Pagination
  const total = filteredMessages.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const page = filters.page;
  const paginatedMessages = filteredMessages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 YouTube Comment Content Analysis</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading comments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 YouTube Comment Content Analysis</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
          <button 
            onClick={loadMessages}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">💬 YouTube Comment Content Analysis</h3>
        <div className="flex items-center space-x-4">
          {/* Filter Controls */}
          <select
            value={filters.flagged}
            onChange={(e) => handleFilterChange('flagged', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="">All Comments</option>
            <option value="true">Flagged Only</option>
            <option value="false">Not Flagged</option>
          </select>
          <select
            value={filters.riskScore}
            onChange={(e) => handleFilterChange('riskScore', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="7">High Risk (7+)</option>
            <option value="4">Medium Risk (4-6)</option>
            <option value="0">Low Risk (0-3)</option>
          </select>
          <button
            onClick={loadMessages}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded-md"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      {paginatedMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">No Comments Found</p>
          <p className="text-sm mt-2">
            {Object.values(filters).some(f => f !== '' && f !== 1) 
              ? 'Try adjusting your filters.'
              : 'No YouTube comments available for analysis.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {paginatedMessages.map((comment) => {
              const id = comment._id || comment.commentId;
              const localFlag = localFlags[id];
              const isFlagged = typeof localFlag === 'boolean' ? localFlag : comment.isFlagged;
              return (
                <div
                  key={id}
                  className={`border rounded-lg p-4 ${isFlagged ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Comment Header */}
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.authorDisplayName || comment.author || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.timestamp || comment.publishedAt)}
                        </span>
                      </div>
                      {/* Comment Content */}
                      <div className="mb-3">
                        <p className="text-gray-800 whitespace-pre-wrap">{comment.textDisplay || comment.text || ''}</p>
                      </div>
                      {/* Suspicious Keywords */}
                      {comment.suspiciousKeywords && comment.suspiciousKeywords.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-red-600 font-medium">Suspicious keywords: </span>
                          {comment.suspiciousKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Right Side - Risk Score and Actions */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(comment.riskScore)}`}>
                        {getRiskScoreLabel(comment.riskScore)} ({comment.riskScore || 0}/10)
                      </div>
                      {/* Flag Button */}
                      <button
                        onClick={() => handleFlagMessage(id, !isFlagged)}
                        className={`text-xs px-3 py-1 rounded-md transition-colors ${
                          isFlagged
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isFlagged ? '🚩 Unflag' : '🏳️ Flag'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} comments
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YouTubeMessagesList; 