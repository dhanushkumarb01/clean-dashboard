const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');

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
      expiry_date: user.youtube.expiry_date
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2ClientForRefresh
    });

    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!channelData.items?.length) {
      return res.status(404).json({ error: 'No YouTube channel found' });
    }

    const channel = channelData.items[0];

    // Update user's YouTube stats
    user.youtube.stats = {
      viewCount: parseInt(channel.statistics.viewCount),
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      lastUpdated: new Date()
    };
    user.youtube.last_stats_update = new Date();

    await user.save();

    res.json({ success: true, message: 'YouTube stats refreshed', stats: user.youtube.stats });
  } catch (err) {
    console.error('Error refreshing YouTube stats:', err);
    res.status(500).json({
      error: 'Failed to refresh YouTube stats',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
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

    user.youtube = undefined; // Remove YouTube data
    await user.save();

    res.json({ success: true, message: 'YouTube account disconnected successfully.' });
  } catch (err) {
    console.error('Error disconnecting YouTube account:', err);
    res.status(500).json({ error: 'Failed to disconnect YouTube account.' });
  }
};

exports.loginWithMobileNumber = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, mobileNumber: user.mobileNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: 'Login successful', token });
  } catch (error) {
    console.error('Login with mobile number error:', error);
    res.status(500).json({ success: false, message: 'Server error during mobile number login.' });
  }
};