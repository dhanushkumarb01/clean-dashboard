const { google } = require('googleapis');
const User = require('../models/User');
const NodeCache = require('node-cache');

// Cache YouTube responses for 5 minutes
const statsCache = new NodeCache({ stdTTL: 300 });

class YouTubeAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(state = '') {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent', // Force refresh token generation
      state
    });
  }

  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to get tokens from Google');
    }
  }

  async refreshAccessToken(userId) {
    try {
      const user = await User.findById(userId).select('+youtube.refresh_token');
      if (!user?.youtube?.refresh_token) {
        throw new Error('No refresh token found');
      }

      this.oauth2Client.setCredentials({
        refresh_token: user.youtube.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      user.youtube.access_token = credentials.access_token;
      user.youtube.last_token_refresh = new Date();
      await user.save();

      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getUserProfile(access_token) {
    try {
      this.oauth2Client.setCredentials({ access_token });
      const oauth2 = google.oauth2('v2');
      const { data } = await oauth2.userinfo.get({ auth: this.oauth2Client });
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get Google user profile');
    }
  }

  async getChannelStats(userId, useCache = true) {
    try {
      // Try cache first
      if (useCache) {
        const cachedStats = statsCache.get(userId);
        if (cachedStats) return cachedStats;
      }

      const user = await User.findById(userId);
      if (!user?.youtube?.access_token) {
        throw new Error('No YouTube connection found');
      }

      this.oauth2Client.setCredentials({
        access_token: user.youtube.access_token
      });

      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      
      try {
        const response = await youtube.channels.list({
          part: 'statistics,snippet',
          id: user.youtube.channel_id
        });

        if (!response.data.items?.length) {
          throw new Error('No channel data found');
        }

        const channel = response.data.items[0];
        const stats = {
          viewCount: parseInt(channel.statistics.viewCount),
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          lastUpdated: new Date()
        };

        // Update cache
        statsCache.set(userId, stats);

        // Update user's stored stats
        user.youtube.stats = stats;
        user.youtube.quota_used += 1; // Track quota usage
        await user.save();

        return stats;

      } catch (error) {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          const newToken = await this.refreshAccessToken(userId);
          this.oauth2Client.setCredentials({ access_token: newToken });
          return this.getChannelStats(userId, false); // Retry without cache
        }
        throw error;
      }

    } catch (error) {
      console.error('Error fetching channel stats:', error);
      throw new Error('Failed to fetch YouTube statistics');
    }
  }

  async handleCallback(code) {
    try {
      // Get tokens from code
      const tokens = await this.getTokensFromCode(code);
      
      // Get user profile
      const profile = await this.getUserProfile(tokens.access_token);
      
      // Get YouTube channel info
      this.oauth2Client.setCredentials({ access_token: tokens.access_token });
      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      const { data: channelData } = await youtube.channels.list({
        part: 'snippet,statistics',
        mine: true
      });

      if (!channelData.items?.length) {
        throw new Error('No YouTube channel found for this account');
      }

      const channel = channelData.items[0];

      // Return all the data needed to update user
      return {
        tokens,
        profile,
        channel: {
          id: channel.id,
          title: channel.snippet.title,
          profilePicture: channel.snippet.thumbnails.default.url,
          statistics: channel.statistics
        }
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to process OAuth callback');
    }
  }

  // Utility to check if stats need refresh
  shouldRefreshStats(lastUpdated) {
    if (!lastUpdated) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastUpdated < fiveMinutesAgo;
  }
}

module.exports = new YouTubeAuthService();
