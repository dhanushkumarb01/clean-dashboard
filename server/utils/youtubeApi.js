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
      console.warn('WARNING: Missing GOOGLE_API_KEY in environment variables and no auth provided');
      // Return null instead of throwing error - client will be created when needed
      return null;
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

// Helper function to check if error is quota-related
const isQuotaError = (error) => {
  const quotaIndicators = [
    'quota',
    'Quota',
    'quotaExceeded',
    'Daily Limit Exceeded',
    'Rate Limit Exceeded',
    'Too Many Requests'
  ];
  
  return quotaIndicators.some(indicator => 
    error?.message?.includes(indicator) || 
    error?.response?.data?.error?.message?.includes(indicator) ||
    error?.code === 'quotaExceeded' ||
    error?.status === 429
  );
};

// Helper function to get fallback stats from database
const getFallbackStats = async (userId) => {
  try {
    if (!userId) return null;
    
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (user?.youtube?.stats) {
      console.log('📦 Using cached stats from database');
      return {
        viewCount: user.youtube.stats.viewCount || 0,
        subscriberCount: user.youtube.stats.subscriberCount || 0,
        videoCount: user.youtube.stats.videoCount || 0,
        commentCount: user.youtube.stats.commentCount || 0,
        uniqueAuthors: user.youtube.stats.uniqueAuthors || 0,
        lastUpdated: user.youtube.stats.lastUpdated || user.youtube.connected_at,
        channelTitle: user.youtube.channel_title || 'YouTube Channel',
        profilePicture: user.youtube.profile_picture || null,
        channelId: user.youtube.channel_id
      };
    }
  } catch (err) {
    console.error('Error getting fallback stats:', err.message);
  }
  
  return null;
};

// Get channel statistics with improved error handling and token management
const getChannelStats = async (accessToken, options = {}) => {
  try {
    if (!accessToken) {
      throw new Error('Access token is required for fetching channel stats');
    }

    console.log('🔄 Starting YouTube API fetch with options:', {
      fresh: options.fresh,
      userId: options.userId,
      hasAccessToken: !!accessToken
    });

    // Try cache first, but only for stable data and when fresh is not requested
    const cacheKey = options.fresh 
      ? `stats:${accessToken.slice(-10)}:${Date.now()}` // Add timestamp for fresh requests
      : `stats:${accessToken.slice(-10)}`; // Use last 10 chars of token as key
    const cached = !options.fresh ? statsCache.get(cacheKey) : null;
    
    if (cached && !options.fresh) {
      console.log('✅ Returning cached stats (fresh not requested)');
      return cached;
    }
    
    console.log('🚀 Fetching fresh stats from YouTube API...');
    
    // Clean the access token
    const cleanAccessToken = accessToken.trim();
    
    // Create a new oauth client instance for this request
    const requestOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID?.trim(),
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
      process.env.GOOGLE_REDIRECT_URI?.trim()
    );
    
    requestOAuthClient.setCredentials({
      access_token: cleanAccessToken
    });

    // Check token validity and refresh if needed
    let validToken = cleanAccessToken;
    try {
      console.log('🔍 Checking token validity...');
      const tokenInfo = await requestOAuthClient.getTokenInfo(cleanAccessToken);
      console.log('✅ Token is valid:', {
        expiresIn: tokenInfo.expires_in,
        scopes: tokenInfo.scope?.split(' ').length || 0
      });
    } catch (tokenError) {
      console.log('⚠️ Token validation failed, attempting refresh...');
      
      // Try to refresh token if we have refresh token
      if (options.userId) {
        try {
          const User = require('../models/User');
          const user = await User.findById(options.userId);
          
          if (user?.youtube?.refresh_token) {
            console.log('🔄 Refreshing token using refresh token...');
            const newAccessToken = await refreshAccessToken(user.youtube.refresh_token);
            
            // Update user with new token
            user.youtube.access_token = newAccessToken;
            await user.save();
            
            validToken = newAccessToken;
            requestOAuthClient.setCredentials({
              access_token: newAccessToken
            });
            console.log('✅ Token refreshed successfully');
          } else {
            console.log('❌ No refresh token available');
            throw new Error('Token expired and no refresh token available');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
          throw new Error('Failed to refresh expired token');
        }
      } else {
        throw new Error('Token validation failed and no user ID provided for refresh');
      }
    }

    // Create YouTube client with validated token
    const youtube = createYoutubeClient(requestOAuthClient);
    
    if (!youtube) {
      throw new Error('Failed to create YouTube client');
    }

    console.log('📡 Making YouTube API call for channel statistics...');
    
    // Get basic channel info with retry logic
    let channelData;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const { data } = await youtube.channels.list({
          part: 'statistics,snippet',
          mine: true,
          fields: 'items(id,statistics(viewCount,subscriberCount,videoCount,commentCount),snippet(title,thumbnails))'
        });
        
        channelData = data;
        break;
      } catch (apiError) {
        retries--;
        
        // Check if this is a quota error
        if (isQuotaError(apiError)) {
          console.log('🔕 YouTube API quota exceeded (silently handled)');
          // Return fallback data immediately for quota errors
          const fallbackStats = await getFallbackStats(options.userId);
          if (fallbackStats) {
            console.log('📦 Returning cached data due to quota limits');
            return fallbackStats;
          }
          // If no fallback available, throw a generic error
          throw new Error('Quota exceeded');
        }
        
        console.log(`⚠️ YouTube API call failed, retries left: ${retries}`, {
          error: apiError.message,
          status: apiError.status,
          code: apiError.code
        });
        
        if (retries === 0) {
          throw apiError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!channelData?.items?.length) {
      throw new Error('No channel data found - user may not have a YouTube channel');
    }

    const channel = channelData.items[0];
    
    // Log raw statistics from YouTube API
    console.log('📊 Raw YouTube API Response:', {
      channelId: channel.id,
      channelTitle: channel.snippet?.title,
      rawStatistics: channel.statistics,
      hasStatistics: !!channel.statistics
    });
    
    // Get comment stats for videos (with timeout and quota error handling)
    let commentStats = { totalComments: 0, uniqueAuthors: 0 };
    try {
      console.log('💬 Fetching comment statistics...');
      const commentPromise = getChannelCommentStats(requestOAuthClient, channel.id, options.userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Comment fetch timeout')), 30000)
      );
      
      commentStats = await Promise.race([commentPromise, timeoutPromise]);
      console.log('✅ Comment stats fetched:', commentStats);
    } catch (commentError) {
      if (isQuotaError(commentError)) {
        console.log('🔕 Comment fetch quota exceeded (using cached data)');
        // Try to get cached comment stats from database
        try {
          const User = require('../models/User');
          const user = await User.findById(options.userId);
          if (user?.youtube?.stats) {
            commentStats = {
              totalComments: user.youtube.stats.commentCount || 0,
              uniqueAuthors: user.youtube.stats.uniqueAuthors || 0
            };
          }
        } catch (dbError) {
          console.log('Could not get cached comment stats:', dbError.message);
        }
      } else {
        console.log('⚠️ Comment stats fetch failed (using defaults):', commentError.message);
      }
      // Use default values - don't fail the entire request
    }
    
    // Build stats object with safe parsing
    const stats = {
      viewCount: parseInt(channel.statistics?.viewCount || 0),
      subscriberCount: parseInt(channel.statistics?.subscriberCount || 0),
      videoCount: parseInt(channel.statistics?.videoCount || 0),
      commentCount: parseInt(channel.statistics?.commentCount || commentStats.totalComments || 0),
      uniqueAuthors: commentStats.uniqueAuthors || 0,
      lastUpdated: new Date(),
      channelTitle: channel.snippet?.title || 'Unknown Channel',
      profilePicture: channel.snippet?.thumbnails?.default?.url || null,
      channelId: channel.id
    };

    // Cache the results
    statsCache.set(cacheKey, stats);
    console.log('✅ Stats successfully fetched and cached:', {
      viewCount: stats.viewCount.toLocaleString(),
      subscriberCount: stats.subscriberCount.toLocaleString(),
      videoCount: stats.videoCount.toLocaleString(),
      commentCount: stats.commentCount.toLocaleString(),
      uniqueAuthors: stats.uniqueAuthors,
      channelTitle: stats.channelTitle
    });
    
    return stats;
  } catch (error) {
    // Enhanced error handling for quota and API issues
    if (isQuotaError(error)) {
      console.log('🔕 Quota error detected, returning fallback data');
      const fallbackStats = await getFallbackStats(options.userId);
      if (fallbackStats) {
        return fallbackStats;
      }
      // If no fallback available, don't throw - return minimal stats
      return {
        viewCount: 0,
        subscriberCount: 0,
        videoCount: 0,
        commentCount: 0,
        uniqueAuthors: 0,
        lastUpdated: new Date(),
        channelTitle: 'YouTube Channel',
        profilePicture: null,
        channelId: ''
      };
    }
    
    console.error('❌ Error fetching channel stats:', {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Try to return fallback data even for non-quota errors
    const fallbackStats = await getFallbackStats(options.userId);
    if (fallbackStats) {
      console.log('📦 Returning cached data due to API error');
      return fallbackStats;
    }
    
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

// Create a default YouTube client with API key for public data (lazy loading)
let youtubeClient = null;
const getYoutubeClient = () => {
  if (!youtubeClient) {
    youtubeClient = createYoutubeClient(process.env.GOOGLE_API_KEY?.trim());
  }
  return youtubeClient;
};

// Add new functions for active users and channels
const getMostActiveUsers = async (userId = null, limit = 5) => {
  try {
    console.log('Fetching most active users from entire comments collection...');
    
    // Fetch from entire comments collection - ignore userId filter
    const users = await Comment.aggregate([
      // No match filter - get from entire collection
      { $group: {
          _id: '$authorChannelId',
          authorDisplayName: { $first: '$authorDisplayName' },
          totalComments: { $sum: 1 }
      }},
      { $sort: { totalComments: -1 } },
      { $limit: limit }
    ]);
    
    console.log('Most active users found:', users.length, 'users');
    return users;
  } catch (error) {
    console.error('Error fetching most active users:', error);
    return []; // Return empty array instead of throwing
  }
};

const getMostActiveChannels = async (userId = null, limit = 5) => {
  try {
    console.log('Fetching most active channels from entire comments collection...');
    
    // Get channel information for all comments - group by the video's channel
    const channels = await Comment.aggregate([
      // No match filter - get from entire collection
      { $group: {
          _id: '$channelId',
          totalComments: { $sum: 1 }
      }},
      { $sort: { totalComments: -1 } },
      { $limit: limit }
    ]);
    
    // Try to get channel details from Channel collection
    const Channel = require('../models/Channel');
    const channelsWithTitles = await Promise.all(
      channels.map(async (channel) => {
        try {
          const channelInfo = await Channel.findOne({ channelId: channel._id });
          return {
            ...channel,
            channelTitle: channelInfo?.title || `Channel ${channel._id.slice(-8)}`
          };
        } catch (err) {
          return {
            ...channel,
            channelTitle: `Channel ${channel._id.slice(-8)}`
          };
        }
      })
    );
    
    console.log('Most active channels found:', channelsWithTitles.length, 'channels');
    return channelsWithTitles;
  } catch (error) {
    console.error('Error fetching most active channels:', error);
    return []; // Return empty array instead of throwing
  }
};

const getAuthorReport = async (userId, authorChannelId) => {
  try {
    console.log(`Fetching author report for authorChannelId: ${authorChannelId}`);

    // Get author details and total comments
    const authorStats = await Comment.aggregate([
      { $match: { authorChannelId: authorChannelId } },
      { $group: {
          _id: "$authorChannelId",
          authorDisplayName: { $first: "$authorDisplayName" },
          totalComments: { $sum: 1 }
      }}
    ]);

    if (authorStats.length === 0) {
      console.log(`No comments or user found for authorChannelId: ${authorChannelId}`);
      return null;
    }

    const { authorDisplayName = authorChannelId, totalComments = 0 } = authorStats[0] || {};

    // Get comment activity over time (e.g., daily)
    const commentActivity = await Comment.aggregate([
      { $match: { authorChannelId: authorChannelId } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } }, // Group by date
          commentCount: { $sum: 1 }
      }},
      { $sort: { _id: 1 } } // Sort by date
    ]);

    // Format for charts if needed
    const formattedActivity = commentActivity.map(item => ({
      date: item._id,
      comments: item.commentCount
    }));

    // Fetch all comments by this author
    const userCommentsRaw = await Comment.find({ authorChannelId: authorChannelId })
      .sort({ publishedAt: -1 })
      .select('textDisplay publishedAt videoId commentId userId channelId');

    const userComments = userCommentsRaw.map(comment => ({
      id: comment.commentId,
      text: comment.textDisplay,
      textDisplay: comment.textDisplay,
      date: comment.publishedAt,
      videoId: comment.videoId,
      userId: comment.userId,
      channelId: comment.channelId
    }));

    // Fetch the 10 most recent comments by this author
    const recentComments = userComments.slice(0, 10);

    return {
      authorDisplayName,
      authorChannelId,
      totalComments,
      commentActivity: formattedActivity,
      recentComments,
      userSummary: null,
      userComments,
      totalLikes: 0,
      averageLikes: 0,
      maxLikes: 0
    };

  } catch (error) {
    console.error('Error fetching author report:', error);
    throw error;
  }
};

module.exports = {
  oauth2Client,
  youtube: getYoutubeClient,
  getAuthUrl,
  getTokensAndProfile,
  refreshAccessToken,
  getChannelStats,
  revokeToken,
  getChannelVideos,
  getVideoCommentCounts,
  getChannelCommentStats,
  getMostActiveUsers,
  getMostActiveChannels,
  getAuthorReport
};
