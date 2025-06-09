const { google } = require('googleapis');
const NodeCache = require('node-cache');
const User = require('../models/User');

// Cache YouTube responses for 5 minutes
const statsCache = new NodeCache({ stdTTL: 300 });

class YouTubeService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
      auth: apiKey
    });
    
    // Cache with 5 minute TTL
    this.cache = new NodeCache({ 
      stdTTL: 300,
      checkperiod: 60
    });

    // Keep track of quota usage
    this.quotaUsage = 0;
    
    // Rate limiting parameters
    this.rateLimitDelay = 100; // Base delay between requests in ms
    this.maxRetries = 3;
  }

  // Helper method for exponential backoff retry
  async retryWithBackoff(operation, maxRetries = this.maxRetries) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        // If successful, add artificial delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        return result;
      } catch (error) {
        lastError = error;
        console.error('YouTube API Error:', {
          message: error.message,
          code: error.code,
          errors: error.errors,
          response: error.response?.data
        });

        if (error.code === 403) {
          throw new Error('YouTube API quota exceeded. Please try again later.');
        }
        if (error.code === 400) {
          const errorDetails = error.response?.data?.error?.message || error.message;
          throw new Error(`Invalid request parameters: ${errorDetails}`);
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  // Fetch channel details with caching and retry
  async getChannelDetails(channelId) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    const cacheKey = `channel:${channelId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.retryWithBackoff(async () => {
        const { data } = await this.youtube.channels.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: [channelId]
        });

        if (!data.items?.length) {
          throw new Error(`Channel not found: ${channelId}`);
        }

        const channel = data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnails: channel.snippet.thumbnails,
          statistics: channel.statistics,
          uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
        };
      });

      this.cache.set(cacheKey, result);
      this.quotaUsage += 1;
      return result;
    } catch (error) {
      console.error(`Error fetching channel ${channelId}:`, error);
      throw error;
    }
  }

  // Fetch recent videos for a channel
  async getRecentVideos(channelId, maxResults = 10) {
    const cacheKey = `videos:${channelId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      // First get the uploads playlist ID
      const channel = await this.getChannelDetails(channelId);
      
      // Then get the playlist items
      const { data } = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId: channel.uploadsPlaylistId,
        maxResults
      });

      const videoIds = data.items.map(item => item.contentDetails.videoId);

      // Get detailed video information
      const { data: videoData } = await this.youtube.videos.list({
        part: ['statistics', 'contentDetails'],
        id: videoIds
      });

      // Combine playlist and video data
      const videos = data.items.map(item => {
        const videoStats = videoData.items.find(v => v.id === item.contentDetails.videoId);
        return {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          publishedAt: item.snippet.publishedAt,
          statistics: videoStats?.statistics || {}
        };
      });

      this.cache.set(cacheKey, videos);
      this.quotaUsage += 3; // playlistItems.list(1) + videos.list(2)
      return videos;
    } catch (error) {
      console.error(`Error fetching videos for channel ${channelId}:`, error);
      throw error;
    }
  }

  // Fetch recent comments for a channel with retry
  async getRecentComments(channelId, maxResults = 100) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    const cacheKey = `comments:${channelId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.retryWithBackoff(async () => {
        const { data } = await this.youtube.commentThreads.list({
          part: ['snippet', 'replies'],
          channelId,
          maxResults,
          order: 'time'
        });

        return data.items.map(item => ({
          id: item.id,
          videoId: item.snippet.videoId,
          authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
          authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId.value,
          text: item.snippet.topLevelComment.snippet.textDisplay,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          replyCount: item.snippet.totalReplyCount
        }));
      });

      this.cache.set(cacheKey, result);
      this.quotaUsage += 1;
      return result;
    } catch (error) {
      console.error(`Error fetching comments for channel ${channelId}:`, error);
      throw error;
    }
  }

  // Search for channels with pagination and retry
  async searchChannels(query, targetCount = 500) {
    if (!query) {
      throw new Error('Search query is required');
    }

    // Validate and sanitize input
    query = query.trim();
    targetCount = Math.min(Math.max(1, targetCount), 500); // Ensure between 1 and 500

    const cacheKey = `search:${query}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      let allChannels = [];
      let nextPageToken = '';
      let attempts = 0;
      const maxAttempts = Math.ceil(targetCount / 50); // YouTube API returns max 50 per page

      while (allChannels.length < targetCount && nextPageToken !== undefined && attempts < maxAttempts) {
        // Log request parameters before making the call
        console.log('YouTube API Request Parameters:', {
          part: 'snippet',
          q: query,
          type: 'channel',
          maxResults: 50,
          pageToken: nextPageToken || undefined,
          relevanceLanguage: 'en',
          order: 'relevance'
        });

        const result = await this.retryWithBackoff(async () => {
          const { data } = await this.youtube.search.list({
            part: 'snippet',
            q: query,
            type: 'channel',
            maxResults: 50,
            pageToken: nextPageToken || undefined,
            relevanceLanguage: 'en',
            order: 'relevance'
          });

          if (!data || !Array.isArray(data.items)) {
            throw new Error('Invalid response from YouTube API');
          }

          return {
            items: data.items,
            nextPageToken: data.nextPageToken
          };
        });

        if (!result.items || result.items.length === 0) {
          console.log('No channels found for query:', query);
          break;
        }

        const channels = result.items
          .filter(item => item && item.id && item.id.channelId)
          .map(item => ({
            id: item.id.channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnails: item.snippet.thumbnails
          }));

        allChannels = [...allChannels, ...channels];
        nextPageToken = result.nextPageToken;
        attempts++;
        this.quotaUsage += 100;

        console.log(`Found ${channels.length} channels (total: ${allChannels.length})`);
      }

      if (allChannels.length === 0) {
        throw new Error(`No channels found for query: ${query}`);
      }

      this.cache.set(cacheKey, allChannels, 3600);
      return allChannels;
    } catch (error) {
      console.error(`Error searching channels with query ${query}:`, error);
      throw error;
    }
  }

  // Get channel details in batches with retry
  async getChannelsDetails(channelIds) {
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      throw new Error('Channel IDs array is required');
    }

    const cacheKey = `channels:${channelIds.join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const results = [];
      // Process in batches of 50 (YouTube API limit)
      for (let i = 0; i < channelIds.length; i += 50) {
        const batch = channelIds.slice(i, i + 50);
        const batchResults = await this.retryWithBackoff(async () => {
          const { data } = await this.youtube.channels.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: batch
          });

          return data.items.map(channel => ({
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnails: channel.snippet.thumbnails,
            statistics: channel.statistics,
            uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
          }));
        });

        results.push(...batchResults);
        this.quotaUsage += 1;
      }

      this.cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      console.error('Error fetching channel details:', error);
      throw error;
    }
  }

  // Get current quota usage
  getQuotaUsage() {
    return this.quotaUsage;
  }

  // Clear all cache
  clearCache() {
    this.cache.flushAll();
    return true;
  }
}

module.exports = YouTubeService;
