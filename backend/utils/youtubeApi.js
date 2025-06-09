const { google } = require('googleapis');
const User = require('../models/User');
const NodeCache = require('node-cache');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// Cache YouTube responses - shorter TTL for live data
const statsCache = new NodeCache({ 
  stdTTL: 60, // 1 minute TTL for real-time stats
  checkperiod: 30 // Check for expired entries every 30 seconds
});

// Log environment variables (with quotes to detect spaces)
console.log('Environment variables check:', {
  clientId: `"${process.env.GOOGLE_CLIENT_ID}"`,
  clientSecret: `"${process.env.GOOGLE_CLIENT_SECRET}"`,
  redirectUri: `"${process.env.GOOGLE_REDIRECT_URI}"`,
  hasApiKey: !!process.env.GOOGLE_API_KEY
});

// Create OAuth2 client instance with trimmed values
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID?.trim(),
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
  process.env.GOOGLE_REDIRECT_URI?.trim()
);

// Function to create YouTube API client
const createYoutubeClient = (auth) => {
  if (!auth) {
    if (!process.env.GOOGLE_API_KEY) {
      console.error('ERROR: Missing GOOGLE_API_KEY in environment variables and no auth provided');
      throw new Error('Authentication or API key required for YouTube API client');
    }
    auth = process.env.GOOGLE_API_KEY?.trim();
  }
  return google.youtube({ 
    version: 'v3', 
    auth 
  });
};

// Get all videos for a channel
const getChannelVideos = async (auth, channelId, maxResults = 50) => {
  const youtube = createYoutubeClient(auth);
  
  try {
    // First get the uploads playlist ID
    const { data: channelResponse } = await youtube.channels.list({
      part: 'contentDetails',
      id: channelId,
    });

    if (!channelResponse.items?.length) {
      throw new Error('Channel not found');
    }

    const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from the uploads playlist
    const { data: playlistResponse } = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults
    });

    return playlistResponse.items.map(item => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt
    }));
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw error;
  }
};

// Get comment statistics including unique authors for specific videos
const getVideoCommentStats = async (auth, videoIds, userId, channelId) => {
  const youtube = createYoutubeClient(auth);
  
  try {
    console.log('Starting getVideoCommentStats with videoIds:', videoIds.length, 'for user:', userId);
    console.log('Sample videoIds:', videoIds.slice(0, 3)); // Log first 3 video IDs
    console.log('ChannelId:', channelId);
    
    // Process videos in batches of 50 (YouTube API limit)
    const batches = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      batches.push(videoIds.slice(i, i + 50));
    }

    let totalComments = 0;
    const uniqueAuthors = new Set(); // Use Set to track unique authors

    // Process each batch
    for (const batch of batches) {
      const { data } = await youtube.videos.list({
        part: 'statistics',
        id: batch.join(',')
      });

      // Sum up comment counts from each video
      data.items?.forEach(video => {
        totalComments += parseInt(video.statistics?.commentCount || 0);
      });
    }

    console.log('Total comments found:', totalComments);

    // If no comments found, return early
    if (totalComments === 0) {
      console.log('No comments found on any videos, returning early');
      return {
        totalComments: 0,
        uniqueAuthors: 0
      };
    }

    // Now fetch actual comments to get unique authors
    // We'll sample a few videos to get author information
    const sampleVideoIds = videoIds.slice(0, Math.min(5, videoIds.length)); // Sample up to 5 videos
    
    console.log('Sampling videos for comments:', sampleVideoIds);
    
    for (const videoId of sampleVideoIds) {
      try {
        console.log(`Fetching comments for video: ${videoId}`);
        
        const { data: commentData } = await youtube.commentThreads.list({
          part: 'snippet',
          videoId: videoId,
          maxResults: 100, // Get up to 100 comments per video
          order: 'time' // Get recent comments
        });

        console.log(`Found ${commentData.items?.length || 0} comments for video ${videoId}`);

        // Extract unique authors from comments and save to DB
        for (const commentItem of commentData.items || []) {
          const snippet = commentItem.snippet?.topLevelComment?.snippet;
          
          if (snippet) {
            const commentDoc = {
              videoId: videoId,
              commentId: commentItem.id,
              authorDisplayName: snippet.authorDisplayName,
              authorChannelId: snippet.authorChannelId?.value || snippet.authorChannelUrl.split('/').pop(), // Use channelId value or extract from URL
              publishedAt: new Date(snippet.publishedAt),
              textDisplay: snippet.textDisplay,
              channelId: channelId, // Channel of the video itself
              userId: userId // Our internal user ID
            };

            // Add author to set for unique count
            const authorIdentifier = snippet.authorChannelId?.value || snippet.authorDisplayName;
            if (authorIdentifier) {
              uniqueAuthors.add(authorIdentifier);
            }

            // Save/update comment in DB
            await Comment.findOneAndUpdate(
              { commentId: commentDoc.commentId },
              { $set: commentDoc },
              { upsert: true, new: true }
            );
          }
        }

      } catch (commentError) {
        console.log(`Could not fetch comments for video ${videoId}:`, commentError.message);
        console.log('Comment error details:', commentError);
        console.log('Error status:', commentError.status);
        console.log('Error code:', commentError.code);
        // Continue with other videos even if one fails
      }
    }

    console.log('Comment stats calculated:', {
      totalComments,
      uniqueAuthorsCount: uniqueAuthors.size,
      videosSampled: sampleVideoIds.length,
      uniqueAuthorsList: Array.from(uniqueAuthors)
    });

    return {
      totalComments,
      uniqueAuthors: uniqueAuthors.size
    };
  } catch (error) {
    console.error('Error fetching video comment stats:', error);
    throw error;
  }
};

// Get comment counts for specific videos (keeping for backward compatibility)
const getVideoCommentCounts = async (auth, videoIds) => {
  const { totalComments } = await getVideoCommentStats(auth, videoIds);
  return totalComments;
};

// Get aggregated comment statistics for a channel
const getChannelCommentStats = async (auth, channelId, userId) => {
  try {
    // Get channel's videos
    const videos = await getChannelVideos(auth, channelId);
    
    if (!videos?.length) {
      console.log('No videos found for channel:', channelId);
      return { totalComments: 0, videoCount: 0, uniqueAuthors: 0 };
    }
    
    // Get comment counts and unique authors for all videos
    const videoIds = videos.map(v => v.videoId);
    const { totalComments, uniqueAuthors } = await getVideoCommentStats(auth, videoIds, userId, channelId);

    return {
      totalComments: totalComments,
      videoCount: videos.length,
      uniqueAuthors: uniqueAuthors
    };
  } catch (error) {
    console.error('Error getting channel comment stats:', error);
    throw error;
  }
};

// Get channel statistics with caching
const getChannelStats = async (accessToken, options = {}) => {
  try {
    if (!accessToken) {
      throw new Error('Access token is required for fetching channel stats');
    }

    // Try cache first, but only for stable data and when fresh is not requested
    const cacheKey = options.fresh 
      ? `stats:${accessToken.slice(-10)}:${Date.now()}` // Add timestamp for fresh requests
      : `stats:${accessToken.slice(-10)}`; // Use last 10 chars of token as key
    const cached = !options.fresh ? statsCache.get(cacheKey) : null;
    
    if (cached && !options.fresh) {
      console.log('Returning cached stats (fresh not requested)');
      return cached;
    }
    
    console.log('Fetching fresh stats from YouTube API...');
    
    oauth2Client.setCredentials({
      access_token: accessToken.trim()
    });

    // Check if token is expired and refresh if needed
    try {
      const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
      console.log('Token info:', {
        expiresIn: tokenInfo.expires_in,
        scope: tokenInfo.scope
      });
    } catch (tokenError) {
      console.log('Token may be expired, attempting to refresh...');
      // If token is expired, we'll need to refresh it
      // This would require the refresh token from the database
      // For now, we'll proceed with the current token
    }

    const youtube = createYoutubeClient(oauth2Client);
    
    if (!youtube) {
      throw new Error('Failed to create YouTube client');
    }

    // Get basic channel info
    const { data } = await youtube.channels.list({
      part: 'statistics,snippet',
      mine: true,
      fields: 'items(id,statistics(viewCount,subscriberCount,videoCount),snippet(title,thumbnails))'
    });

    if (!data.items?.length) {
      throw new Error('No channel data found');
    }

    const channel = data.items[0];
    
    // Log raw statistics from YouTube API
    console.log('Raw YouTube API Response:', {
      channelId: channel.id,
      channelTitle: channel.snippet.title,
      rawStatistics: channel.statistics,
      viewCount: channel.statistics?.viewCount,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount
    });
    
    // Get comment stats for all videos
    const commentStats = await getChannelCommentStats(oauth2Client, channel.id, options.userId);
    
    // Log the retrieved statistics for debugging
    console.log('YouTube Channel Statistics (Fresh Fetch):', {
      hasStatistics: !!channel.statistics,
      statistics: channel.statistics,
      commentStats,
      channelId: channel.id,
      fresh: options.fresh
    });
    
    const stats = {
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      commentCount: commentStats.totalComments || 0,
      uniqueAuthors: commentStats.uniqueAuthors || 0,
      lastUpdated: new Date(),
      channelTitle: channel.snippet.title,
      profilePicture: channel.snippet.thumbnails.default.url
    };

    // Cache the results (even for fresh requests to avoid repeated API calls)
    statsCache.set(cacheKey, stats);
    console.log('Stats cached and returned:', {
      viewCount: stats.viewCount,
      subscriberCount: stats.subscriberCount,
      videoCount: stats.videoCount,
      commentCount: stats.commentCount,
      uniqueAuthors: stats.uniqueAuthors
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    throw error;
  }
};

// Token management functions
const getAuthUrl = (state = '') => {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    prompt: 'consent',
    state: state || process.env.FRONTEND_URL,
  });
};

const getTokensAndProfile = async (code) => {
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    
    if (!code || !redirectUri) {
      throw new Error('Missing code or redirect URI for token exchange');
    }
    
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });

    if (!tokens?.access_token) {
      throw new Error('Failed to obtain access token from Google');
    }

    oauth2Client.setCredentials(tokens);

    // Get user profile and channel info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    
    const youtube = createYoutubeClient(oauth2Client);
    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!channelData.items?.length) {
      throw new Error('No YouTube channel found for this user');
    }

    return {
      tokens,
      profile,
      channel: channelData.items[0]
    };
  } catch (error) {
    console.error('Error in getTokensAndProfile:', error);
    throw error;
  }
};

const refreshAccessToken = async (refreshToken) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh access token');
  }
};

const revokeToken = async (token) => {
  try {
    await oauth2Client.revokeCredentials(token);
    console.log('Token successfully revoked.');
  } catch (error) {
    console.error('Error during token revocation:', error);
    throw error;
  }
};

// Create a default YouTube client with API key for public data
const youtubeClient = createYoutubeClient(process.env.GOOGLE_API_KEY?.trim());

// Add new functions for active users and channels
const getMostActiveUsers = async (userId, limit = 5) => {
  try {
    console.log('Fetching most active users for userId:', userId);
    
    // First, let's check if there are any comments in the database
    const totalComments = await Comment.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    console.log('Total comments in database for user:', totalComments);
    
    if (totalComments === 0) {
      console.log('No comments found in database, attempting to fetch from YouTube API...');
      
      // Get the user to access their YouTube token
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user?.youtube?.access_token) {
        console.log('No YouTube access token found for user');
        return [];
      }
      
      // Fetch comments from YouTube API
      try {
        const commentStats = await getChannelCommentStats(user.youtube.access_token, user.youtube.channel_id, userId);
        console.log('Fetched comments from YouTube API:', commentStats);
        
        // Check again if comments were saved
        const updatedCommentCount = await Comment.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
        console.log('Updated comment count in database:', updatedCommentCount);
        
        if (updatedCommentCount === 0) {
          console.log('Still no comments in database after fetching from API');
          return [];
        }
      } catch (fetchError) {
        console.log('Error fetching comments from YouTube API:', fetchError.message);
        return [];
      }
    }
    
    const users = await Comment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: '$authorChannelId',
          authorDisplayName: { $first: '$authorDisplayName' },
          totalComments: { $sum: 1 }
      }},
      { $sort: { totalComments: -1 } },
      { $limit: limit }
    ]);
    
    console.log('Most active users found:', users);
    return users;
  } catch (error) {
    console.error('Error fetching most active users:', error);
    throw error;
  }
};

const getMostActiveChannels = async (userId, limit = 5) => {
  try {
    console.log('Fetching most active channels for userId:', userId);
    
    // First, let's check if there are any comments in the database
    const totalComments = await Comment.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    console.log('Total comments in database for user:', totalComments);
    
    if (totalComments === 0) {
      console.log('No comments found in database, attempting to fetch from YouTube API...');
      
      // Get the user to access their YouTube token
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user?.youtube?.access_token) {
        console.log('No YouTube access token found for user');
        return [];
      }
      
      // Fetch comments from YouTube API
      try {
        const commentStats = await getChannelCommentStats(user.youtube.access_token, user.youtube.channel_id, userId);
        console.log('Fetched comments from YouTube API:', commentStats);
        
        // Check again if comments were saved
        const updatedCommentCount = await Comment.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
        console.log('Updated comment count in database:', updatedCommentCount);
        
        if (updatedCommentCount === 0) {
          console.log('Still no comments in database after fetching from API');
          return [];
        }
      } catch (fetchError) {
        console.log('Error fetching comments from YouTube API:', fetchError.message);
        return [];
      }
    }
    
    // Get channel information for the comments
    const channels = await Comment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: '$channelId',
          totalComments: { $sum: 1 }
      }},
      { $sort: { totalComments: -1 } },
      { $limit: limit }
    ]);
    
    // For now, we'll use the channelId as the title since we don't store channel titles
    // In a production app, you might want to fetch channel details from YouTube API
    const channelsWithTitles = channels.map(channel => ({
      ...channel,
      channelTitle: `Channel ${channel._id.slice(-8)}` // Use last 8 chars of channelId as display name
    }));
    
    console.log('Most active channels found:', channelsWithTitles);
    return channelsWithTitles;
  } catch (error) {
    console.error('Error fetching most active channels:', error);
    throw error;
  }
};

module.exports = {
  oauth2Client,
  youtube: youtubeClient,
  getAuthUrl,
  getTokensAndProfile,
  refreshAccessToken,
  getChannelStats,
  revokeToken,
  getChannelVideos,
  getVideoCommentCounts,
  getChannelCommentStats,
  getMostActiveUsers,
  getMostActiveChannels
};