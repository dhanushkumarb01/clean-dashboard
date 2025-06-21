import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const TelegramMessagesList = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    flagged: false,
    riskScore: ''
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);
      if (filters.flagged) queryParams.append('flagged', 'true');
      if (filters.riskScore) queryParams.append('riskScore', filters.riskScore);
      
      const response = await apiRequest(`/api/telegram/messages?${queryParams.toString()}`);
      
      if (response.success) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError(`Failed to fetch messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  const handleFlagMessage = async (messageId, reason = 'Flagged as suspicious') => {
    try {
      const response = await apiRequest(`/api/telegram/messages/${messageId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      
      if (response.success) {
        // Update the message in the list
        setMessages(messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isFlagged: true, flagReason: reason }
            : msg
        ));
      }
    } catch (err) {
      console.error('Error flagging message:', err);
    }
  };

  const handleUnflagMessage = async (messageId) => {
    try {
      const response = await apiRequest(`/api/telegram/messages/${messageId}/unflag`, {
        method: 'POST'
      });
      
      if (response.success) {
        // Update the message in the list
        setMessages(messages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isFlagged: false, flagReason: null }
            : msg
        ));
      }
    } catch (err) {
      console.error('Error unflagging message:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 7) return 'text-red-600';
    if (riskScore >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSenderDisplay = (message) => {
    if (message.senderUsername) return `@${message.senderUsername}`;
    if (message.senderFirstName) {
      return `${message.senderFirstName} ${message.senderLastName || ''}`.trim();
    }
    return `User ID: ${message.senderId}`;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h3>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchMessages}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Messages</h3>
        <div className="text-sm text-gray-600">
          {pagination.total || 0} total messages
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.flagged}
            onChange={(e) => handleFilterChange('flagged', e.target.checked)}
            className="mr-2"
          />
          Show only flagged messages
        </label>
        
        <select
          value={filters.riskScore}
          onChange={(e) => handleFilterChange('riskScore', e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded"
        >
          <option value="">All risk levels</option>
          <option value="4">Medium risk (4+)</option>
          <option value="7">High risk (7+)</option>
        </select>

        <select
          value={filters.limit}
          onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded"
        >
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No messages found</p>
        ) : (
          messages.map((message) => (
            <div 
              key={message._id} 
              className={`p-4 border rounded-lg ${
                message.isFlagged ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              {/* Message Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {getSenderDisplay(message)}
                    </span>
                    <span className="text-sm text-gray-500">
                      in {message.chatName}
                    </span>
                    <span className={`text-sm font-medium ${getRiskColor(message.riskScore)}`}>
                      Risk: {message.riskScore}/10
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {message.isFlagged ? (
                    <button
                      onClick={() => handleUnflagMessage(message._id)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Unflag
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFlagMessage(message._id)}
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Flag
                    </button>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="mb-2">
                <p className="text-gray-700">
                  {message.messageText || (
                    <span className="italic text-gray-500">
                      [{message.messageType} message]
                    </span>
                  )}
                </p>
              </div>

              {/* Message Metadata */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Type: {message.messageType}</span>
                <span>Words: {message.wordCount}</span>
                {message.views > 0 && <span>Views: {message.views}</span>}
                {message.forwards > 0 && <span>Forwards: {message.forwards}</span>}
                {message.containsUrls && <span className="text-yellow-600">📎 Contains URLs</span>}
                {message.containsHashtags && <span className="text-blue-600"># Has hashtags</span>}
                {message.containsMentions && <span className="text-purple-600">@ Has mentions</span>}
              </div>

              {/* Suspicious Keywords */}
              {message.suspiciousKeywords && message.suspiciousKeywords.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-100 rounded">
                  <span className="text-xs font-medium text-yellow-800">
                    Suspicious keywords: {message.suspiciousKeywords.join(', ')}
                  </span>
                </div>
              )}

              {/* Flag Reason */}
              {message.isFlagged && message.flagReason && (
                <div className="mt-2 p-2 bg-red-100 rounded">
                  <span className="text-xs font-medium text-red-800">
                    Flag reason: {message.flagReason}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TelegramMessagesList;
