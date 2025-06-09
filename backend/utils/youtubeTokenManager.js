const User = require('../models/User');
const { google } = require('googleapis');

class YouTubeTokenManager {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async refreshAccessToken(user) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: user.youtube.refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update user's token in database
      user.youtube.access_token = credentials.access_token;
      await user.save();
      
      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async fetchLatestYouTubeStats(user) {
    try {
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
        
        // Update user's YouTube stats
        user.youtube.stats = {
          viewCount: parseInt(channel.statistics.viewCount),
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          lastUpdated: new Date()
        };

        user.youtube.channel_title = channel.snippet.title;
        user.youtube.profile_picture = channel.snippet.thumbnails.default.url;
        
        await user.save();
        return user.youtube.stats;
      } catch (error) {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          const newToken = await this.refreshAccessToken(user);
          this.oauth2Client.setCredentials({ access_token: newToken });
          return this.fetchLatestYouTubeStats(user);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
      throw new Error('Failed to fetch YouTube statistics');
    }
  }

  async syncAllUsersYouTubeData() {
    try {
      const users = await User.find({ 'youtube.channel_id': { $exists: true } });
      
      const results = await Promise.allSettled(
        users.map(user => this.fetchLatestYouTubeStats(user))
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = results.filter(r => r.status === 'fulfilled').length;

      return { total: users.length, succeeded, failed };
    } catch (error) {
      console.error('Error syncing all users:', error);
      throw new Error('Failed to sync YouTube data for all users');
    }
  }
}

module.exports = new YouTubeTokenManager();
