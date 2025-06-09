const { google } = require('googleapis');
const User = require('../models/User');

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

// Generate auth URL with proper scopes
const getAuthUrl = (state = '') => {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  console.log('Generating auth URL:', {
    redirectUri: `"${redirectUri}"`,
    state: `"${state}"`,
    clientId: `"${process.env.GOOGLE_CLIENT_ID?.trim()}"`
  });
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ],
    prompt: 'consent',
    state: state || process.env.FRONTEND_URL,
  });
};

// Exchange code for tokens and get user profile
const getTokensAndProfile = async (code) => {
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    console.log('Exchanging code for tokens:', {
      redirectUri: `"${redirectUri}"`,
      hasCode: !!code,
      clientId: `"${process.env.GOOGLE_CLIENT_ID?.trim()}"`,
      hasApiKey: !!process.env.GOOGLE_API_KEY
    });
    
    // Exchange code for tokens using standard web server flow
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

    console.log('Received tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Set credentials for subsequent API calls
    oauth2Client.setCredentials(tokens);

    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    // Get YouTube channel info using OAuth client
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
    console.error('Error in getTokensAndProfile:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });
    throw error;
  }
};

// Refresh access token
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

// Get channel statistics
const getChannelStats = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('Access token is required for fetching channel stats');
    }

    oauth2Client.setCredentials({
      access_token: accessToken.trim()
    });

    const youtube = createYoutubeClient(oauth2Client);
    
    if (!youtube) {
      throw new Error('Failed to create YouTube client');
    }

    const { data } = await youtube.channels.list({
      part: 'statistics,snippet',
      mine: true
    });

    if (!data.items?.length) {
      throw new Error('No channel data found');
    }

    const channel = data.items[0];
    return {
      viewCount: parseInt(channel.statistics.viewCount),
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      commentCount: parseInt(channel.statistics.commentCount || 0),
      lastUpdated: new Date(),
      channelTitle: channel.snippet.title,
      profilePicture: channel.snippet.thumbnails.default.url
    };
  } catch (error) {
    console.error('Error fetching channel stats:', error);
    throw new Error('Failed to fetch channel statistics');
  }
};

const revokeToken = async (token) => {
  try {
    console.log('Attempting to revoke token:', token);
    await oauth2Client.revokeCredentials(token);
    console.log('Token successfully revoked.');
  } catch (error) {
    console.error('Error during token revocation:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    throw error;
  }
};

// Create a default YouTube client with API key for public data
const youtubeClient = createYoutubeClient(process.env.GOOGLE_API_KEY?.trim());

module.exports = {
  oauth2Client,
  youtube: youtubeClient,
  getAuthUrl,
  getTokensAndProfile,
  refreshAccessToken,
  getChannelStats,
  revokeToken
};