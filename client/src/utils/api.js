import axios from "axios";

// Error handler utility
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || error.response.data?.error || error.message;
    
    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        message: message,
        data: error.response.data
      });
    }
    
    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Only redirect to login if not already on auth-related pages
        if (!window.location.pathname.includes('/auth/') && !window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Authentication required. Please login.');
      
      case 403:
        throw new Error('You do not have permission to access this resource.');
      
      case 404:
        throw new Error('Resource not found.');
      
      case 429:
        throw new Error('API rate limit exceeded. Please try again later.');
      
      default:
        throw new Error(message);
    }
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network error:', error.request);
    throw new Error('Network error. Please check your connection.');
  } else {
    // Something else happened
    console.error('Error:', error.message);
    throw error;
  }
};

// Create axios instance with defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Don't add token for auth routes
  if (config.url.includes('/auth/google') || config.url.includes('/auth/google/callback')) {
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => handleApiError(error)
);

// User endpoints
export const user = {
  // Get user profile by ID
  fetchUser: (userId) => 
    api.get(`/users/${userId}`).catch(handleApiError),
  
  // Get current authenticated user
  getCurrentUser: () => 
    api.get('/auth/me').catch(handleApiError),
  
  // Update user profile
  updateUser: (data) => 
    api.put('/auth/me', data).catch(handleApiError)
};

// YouTube endpoints
export const youtube = {
  // Get Google OAuth URL
  getAuthUrl: (state = '') => 
    api.get(`/auth/google${state ? `?state=${encodeURIComponent(state)}` : ''}`),
  
  // Get channel statistics
  getStats: async () => {
    try {
      const response = await api.get('/auth/youtube/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
      throw error;
    }
  },
  
  // Get channel information
  getChannel: async () => {
    try {
      const response = await api.get('/auth/youtube/channel');
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube channel:', error);
      throw error;
    }
  },
  
  // Refresh YouTube stats
  refreshStats: async () => {
    try {
      const response = await api.post('/auth/youtube/refresh');
      return response.data;
    } catch (error) {
      console.error('Error refreshing YouTube stats:', error);
      throw error;
    }
  },
  
  // Disconnect YouTube account
  disconnect: async () => {
    try {
      const response = await api.post('/youtube/disconnect');
      return response.data;
    } catch (error) {
      console.error('Error disconnecting YouTube account:', error);
      throw error;
    }
  },

  // Get overview data for dashboard
  fetchOverview: async (options = {}) => {
    try {
      const response = await api.get('/youtube/overview', {
        params: {
          fresh: options.fresh ? 'true' : undefined
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube overview:', error);
      throw error;
    }
  },

  // Get current quota usage
  getQuotaUsage: async () => {
    try {
      const response = await api.get('/youtube/quota');
      return response.data;
    } catch (error) {
      console.error('Error fetching quota usage:', error);
      throw error;
    }
  },

  // Get most active users
  getMostActiveUsers: async () => {
    try {
      const response = await api.get('/youtube/most-active-users');
      return response.data;
    } catch (error) {
      console.error('Error fetching most active users:', error);
      throw error;
    }
  },

  // Get most active channels
  getMostActiveChannels: async () => {
    try {
      const response = await api.get('/youtube/most-active-channels');
      return response.data;
    } catch (error) {
      console.error('Error fetching most active channels:', error);
      throw error;
    }
  },

  // Get channel statistics by channel ID
  getChannelStatistics: async (channelId) => {
    try {
      const response = await api.get(`/youtube/channel/${channelId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching channel statistics for ${channelId}:`, error);
      throw error;
    }
  },

  // Get author report
  getAuthorReport: async (authorChannelId) => {
    try {
      const response = await api.get(`/youtube/report/${authorChannelId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching author report for ${authorChannelId}:`, error);
      throw error;
    }
  },

  getMessageAnalysis: async () => {
    try {
      const response = await api.get('/youtube/messages/analysis');
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube message analysis:', error);
      throw error;
    }
  },

  getThreatStats: async () => {
    try {
      const response = await api.get('/youtube/threats/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube threat stats:', error);
      throw error;
    }
  },
};

// Telegram endpoints
export const telegram = {
  // Get Telegram statistics
  getStats: async () => {
    try {
      const response = await api.get('/telegram/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Telegram stats:', error);
      throw error;
    }
  },

  // Get most active users
  getMostActiveUsers: async () => {
    try {
      const response = await api.get('/telegram/most-active-users');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching most active users:', error);
      throw error;
    }
  },

  // Get most active groups
  getMostActiveGroups: async () => {
    try {
      const response = await api.get('/telegram/most-active-groups');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching most active groups:', error);
      throw error;
    }
  },

  // Get user report by user ID
  getUserReport: async (userId) => {
    try {
      const response = await api.get(`/telegram/user/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching Telegram user report for ${userId}:`, error);
      throw error;
    }
  },

  // Get group report by group ID
  getGroupReport: async (groupId) => {
    try {
      const response = await api.get(`/telegram/group/${groupId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching Telegram group report for ${groupId}:`, error);
      throw error;
    }
  },

  // Get top users by groups joined
  getTopUsersByGroups: async () => {
    try {
      const response = await api.get('/telegram/top-users-by-groups');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top users by groups:', error);
      throw error;
    }
  },

  // Get statistics history for charts
  getStatsHistory: async (limit = 30) => {
    try {
      const response = await api.get('/telegram/stats-history', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching stats history:', error);
      throw error;
    }
  },

  // Store new statistics (for Python script)
  storeStats: async (statsData) => {
    try {
      const response = await api.post('/telegram/store-stats', statsData);
      return response.data;
    } catch (error) {
      console.error('Error storing Telegram stats:', error);
      throw error;
    }
  },

  // Get Telegram messages with filtering and pagination
  getMessages: async (options = {}) => {
    try {
      const response = await api.get('/telegram/messages', {
        params: {
          page: options.page || 1,
          limit: options.limit || 50,
          flagged: options.flagged,
          riskScore: options.riskScore,
          chatId: options.chatId,
          senderId: options.senderId
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      throw error;
    }
  },

  // Flag/unflag a message
  flagMessage: async (messageId, flagged, reason = null) => {
    try {
      const response = await api.put(`/telegram/messages/${messageId}/flag`, {
        flagged,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error flagging message:', error);
      throw error;
    }
  },

  // Batch flag messages
  batchFlagMessages: async (messageIds, flagged, reason = null) => {
    try {
      const response = await api.put('/telegram/messages/batch-flag', {
        messageIds,
        flagged,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error batch flagging messages:', error);
      throw error;
    }
  },

  // Get message statistics
  getMessageStats: async () => {
    try {
      const response = await api.get('/telegram/messages/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching message stats:', error);
      throw error;
    }
  },

  // Get law enforcement analytics
  getLawEnforcementStats: async () => {
    try {
      const response = await api.get('/telegram/law-enforcement-stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching law enforcement stats:', error);
      throw error;
    }
  },

  // Get suspicious activity summary
  getSuspiciousActivity: async () => {
    try {
      const response = await api.get('/telegram/suspicious-activity');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      throw error;
    }
  }
};

// WhatsApp endpoints
export const whatsapp = {
  // Get WhatsApp dashboard statistics
  getStats: async () => {
    try {
      const response = await api.get('/whatsapp/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching WhatsApp stats:', error);
      throw error;
    }
  },

  // Send WhatsApp message
  sendMessage: async (phoneNumber, message, messageType = 'text') => {
    try {
      const response = await api.post('/whatsapp/send-message', {
        to: phoneNumber,
        message,
        messageType
      });
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  },

  // Get recent messages
  getRecentMessages: async (limit = 50, offset = 0) => {
    try {
      const response = await api.get('/whatsapp/messages', {
        params: { limit, offset }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      throw error;
    }
  },

  // Get conversation with specific contact
  getConversation: async (phoneNumber, limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/whatsapp/conversation/${encodeURIComponent(phoneNumber)}`, {
        params: { limit, offset }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  getMessageAnalysis: async () => {
    try {
      const response = await api.get('/whatsapp/messages/analysis');
      return response.data;
    } catch (error) {
      console.error('Error fetching WhatsApp message analysis:', error);
      throw error;
    }
  },

  getThreatStats: async () => {
    try {
      const response = await api.get('/whatsapp/threats/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching WhatsApp threat stats:', error);
      throw error;
    }
  },
};

// Auth endpoints
export const auth = {
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
};

export default api;
