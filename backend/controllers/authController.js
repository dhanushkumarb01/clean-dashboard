const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { google } = require('googleapis');

exports.googleCallback = async (req, res) => {
  console.log('--> googleCallback function started');
  try {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    // Verify state to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { received: state, stored: storedState });
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Invalid state parameter')}`);
    }

    // Clear the state cookie
    res.clearCookie('oauth_state');

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('No authorization code provided')}`);
    }

    const redirectUriForExchange = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUriForExchange) {
      console.error('Missing GOOGLE_REDIRECT_URI in .env for token exchange');
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Backend configuration error: Missing Google Redirect URI')}`);
    }

    console.log('Exchanging code for tokens:', {
      hasCode: !!code,
      redirectUri: redirectUriForExchange
    });

    const tokenExchangeParams = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUriForExchange,
    };

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: tokenExchangeParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;
    console.log('Received tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Get user profile
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = userInfoResponse.data;

    // Create OAuth client for YouTube API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });

    // Create YouTube API client with OAuth credentials
    const youtube = google.youtube({ 
      version: 'v3', 
      auth: oauth2Client 
    });

    // Get YouTube channel info
    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!channelData.items?.length) {
      throw new Error('No YouTube channel found for this user');
    }

    const channel = channelData.items[0];
    console.log('Retrieved channel data:', {
      id: channel.id,
      title: channel.snippet.title,
      hasStats: !!channel.statistics
    });

    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.email });
      if (user) {
        user.googleId = profile.id;
      } else {
        user = new User({
          email: profile.email,
          googleId: profile.id,
          name: profile.name,
          picture: profile.picture
        });
      }
    }

    // Update user's YouTube data
    user.youtube = {
      google_email: profile.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      channel_id: channel.id,
      connected_at: new Date(),
      channel_title: channel.snippet.title,
      profile_picture: channel.snippet.thumbnails.default.url,
      stats: {
        viewCount: parseInt(channel.statistics.viewCount),
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        lastUpdated: new Date()
      }
    };

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', {
      message: err.message,
      code: err.code,
      status: err.status,
      response: err.response?.data
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message)}`);
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account was not found'
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      hasYouTube: !!user.youtube,
      lastLogin: user.lastLogin,
      youtube: user.youtube ? {
        channelTitle: user.youtube.channel_title,
        profilePicture: user.youtube.profile_picture,
        stats: user.youtube.stats
      } : null
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      error: 'User fetch failed',
      message: 'Failed to fetch user data'
    });
  }
};

exports.refreshYouTubeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    // Initialize oauth2Client here for token refresh and API calls
    const oauth2ClientForRefresh = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI // Use the same redirect URI
    );
    oauth2ClientForRefresh.setCredentials({
      access_token: user.youtube.access_token,
      refresh_token: user.youtube.refresh_token,
      expiry_date: user.youtube.access_token_expires_at // Assuming you store this
    });

    // Attempt to refresh token if expired or close to expiration
    // Note: oauth2ClientForRefresh.isAccessTokenExpired is for 'google-auth-library' v7+
    // If using an older version, direct comparison with expiry_date might be needed
    if (oauth2ClientForRefresh.credentials.expiry_date && Date.now() >= oauth2ClientForRefresh.credentials.expiry_date - (5 * 60 * 1000) // refresh 5 mins before expiry
      ) {
      console.log('Access token expired or close to expiry, refreshing...');
      const { credentials } = await oauth2ClientForRefresh.refreshAccessToken();
      user.youtube.access_token = credentials.access_token;
      user.youtube.access_token_expires_at = credentials.expiry_date;
      if (credentials.refresh_token) { // Refresh token can be new
        user.youtube.refresh_token = credentials.refresh_token;
      }
      await user.save();
      console.log('Access token refreshed.');
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2ClientForRefresh, key: process.env.GOOGLE_API_KEY });
    const { data: channelData } = await youtube.channels.list({
      part: 'statistics',
      id: user.youtube.channel_id,
    });

    if (!channelData.items?.length) {
      throw new Error('No YouTube channel statistics found');
    }

    const newStats = channelData.items[0].statistics;
    const stats = {
      viewCount: parseInt(newStats.viewCount),
      subscriberCount: parseInt(newStats.subscriberCount),
      videoCount: parseInt(newStats.videoCount),
      lastUpdated: new Date()
    };

    user.youtube.stats = stats;
    await user.save();

    res.json(stats);
  } catch (err) {
    console.error('Refresh YouTube stats error:', err);
    res.status(500).json({ error: 'Failed to refresh YouTube stats' });
  }
};

exports.getYouTubeChannel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    res.json({
      channelTitle: user.youtube.channel_title,
      profilePicture: user.youtube.profile_picture,
      channelId: user.youtube.channel_id,
    });
  } catch (err) {
    console.error('Get YouTube channel error:', err);
    res.status(500).json({ error: 'Failed to get YouTube channel info' });
  }
};

exports.getYouTubeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    res.json(user.youtube.stats);
  } catch (err) {
    console.error('Get YouTube stats error:', err);
    res.status(500).json({ error: 'Failed to get YouTube stats' });
  }
};

exports.disconnectYouTube = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If YouTube is connected, revoke the token
    if (user.youtube && user.youtube.refresh_token) {
      console.log('Attempting to revoke YouTube refresh token for user:', user.email);
      try {
        // Initialize oauth2Client here for token revocation if not initialized globally
        const oauth2ClientForRevocation = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI // Use the same redirect URI
        );
        oauth2ClientForRevocation.setCredentials({ refresh_token: user.youtube.refresh_token });
        await oauth2ClientForRevocation.revokeCredentials();
        console.log('YouTube refresh token revoked successfully.');
      } catch (revokeError) {
        console.error('Error revoking YouTube refresh token:', revokeError.message);
        // Continue to clear data even if revocation fails, as user expects disconnect
      }
    }

    // Clear YouTube data from user model
    user.youtube = undefined;
    await user.save();

    res.json({ message: 'YouTube account disconnected successfully' });
  } catch (err) {
    console.error('Disconnect YouTube error:', err);
    res.status(500).json({ error: 'Failed to disconnect YouTube account' });
  }
};