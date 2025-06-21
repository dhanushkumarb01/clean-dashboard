import React, { useState, useEffect } from 'react';
import { telegram } from '../utils/api';

const TelegramMessagesList = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    flagged: '',
    riskScore: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterOptions = {
        page: filters.page,
        limit: 50
      };
      
      if (filters.flagged !== '') {
        filterOptions.flagged = filters.flagged === 'true';
      }
      if (filters.riskScore !== '') {
        filterOptions.riskScore = parseInt(filters.riskScore);
      }
      
      const response = await telegram.getMessages(filterOptions);
      setMessages(response.messages || []);
      setPagination(response.pagination || {});
      
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagMessage = async (messageId, flagged) => {
    try {
      await telegram.flagMessage(messageId, flagged, flagged ? 'User flagged as suspicious' : null);
      
      // Update the message in the local state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId
            ? { ...msg, isFlagged: flagged, flaggedAt: flagged ? new Date() : null }
            : msg
        )
      );
      
    } catch (err) {
      console.error('Error flagging message:', err);
      alert('Failed to update message flag');
    }
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
  }, [filters]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Message Content Analysis</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Message Content Analysis</h3>
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
        <h3 className="text-lg font-medium text-gray-900">💬 Message Content Analysis</h3>
        <div className="flex items-center space-x-4">
          {/* Filter Controls */}
          <select
            value={filters.flagged}
            onChange={(e) => handleFilterChange('flagged', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="">All Messages</option>
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
            <option value="4">Medium Risk (4+)</option>
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

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">No Messages Found</p>
          <p className="text-sm mt-2">
            {Object.values(filters).some(f => f !== '' && f !== 1) 
              ? 'Try adjusting your filters or add some demo messages to test the features.'
              : 'Run the message collection script to gather Telegram messages.'}
          </p>
        </div>
      ) : (
        <>
          {/* Messages List */}
          <div className="space-y-4 mb-6">
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`border rounded-lg p-4 ${message.isFlagged ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Message Header */}
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.senderUsername ? `@${message.senderUsername}` : 
                           `${message.senderFirstName || ''} ${message.senderLastName || ''}`.trim() ||
                           'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">in</span>
                        <span className="text-sm text-blue-600">{message.chatName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="mb-3">
                      <p className="text-gray-800 whitespace-pre-wrap">{message.messageText}</p>
                    </div>

                    {/* Message Metadata */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>👁️ {message.views || 0} views</span>
                      <span>📤 {message.forwards || 0} forwards</span>
                      <span>📝 {message.wordCount || 0} words</span>
                      {message.containsUrls && <span className="text-orange-600">🔗 URLs</span>}
                      {message.containsHashtags && <span className="text-blue-600"># Hashtags</span>}
                    </div>

                    {/* Suspicious Keywords */}
                    {message.suspiciousKeywords && message.suspiciousKeywords.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-red-600 font-medium">Suspicious keywords: </span>
                        {message.suspiciousKeywords.map((keyword, index) => (
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
                    {/* Risk Score */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(message.riskScore)}`}>
                      {getRiskScoreLabel(message.riskScore)} ({message.riskScore}/10)
                    </div>

                    {/* Flag Button */}
                    <button
                      onClick={() => handleFlagMessage(message._id, !message.isFlagged)}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        message.isFlagged
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {message.isFlagged ? '🚩 Unflag' : '🏳️ Flag'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} messages
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
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

export default TelegramMessagesList;
