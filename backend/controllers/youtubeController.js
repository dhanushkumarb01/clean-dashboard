const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAuthUrl, getTokensAndProfile } = require('../utils/youtubeApi');
const youtubeApi = require('../utils/youtubeApi');

// Log environment variables at startup
console.log('YouTube Controller - Environment check:', {
  redirectUri: `"${process.env.GOOGLE_REDIRECT_URI?.trim()}"`,
  frontendUrl: `"${process.env.FRONTEND_URL?.trim()}"`
});

exports.getAuthUrl = async (req, res) => {
  try {
    const url = getAuthUrl();
    console.log('Generated auth URL with redirect:', `"${process.env.GOOGLE_REDIRECT_URI?.trim()}"`);
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
};

exports.handleOAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  
  console.log('OAuth Callback received:', {
    hasCode: !!code,
    hasState: !!state,
    redirectUri: `"${redirectUri}"`,
    query: req.query
  });

  if (!code) {
    console.error('OAuth callback missing authorization code');
    return res.redirect(`${process.env.FRONTEND_URL?.trim()}/auth/error?message=${encodeURIComponent('Authorization code is required')}`);
  }

  try {
    const { tokens, profile, channel } = await getTokensAndProfile(code);

    // Get or create user
    let user = await User.findOne({ email: profile.email });
    if (!user) {
      console.log('Creating new user...');
      user = await User.create({
        email: profile.email,
        name: profile.name,
        googleId: profile.id,
        youtube: {
          google_email: profile.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          channel_id: channel.id,
          connected_at: new Date(),
          channel_title: channel.snippet.title,
          profile_picture: channel.snippet.thumbnails.default.url,        stats: {
          viewCount: parseInt(channel.statistics.viewCount),
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          commentCount: parseInt(channel.statistics.commentCount || 0),
          lastUpdated: new Date()
        },
        quota_used: 1 // Initial channels.list call
        }
      });
      console.log('New user created:', user._id);
    } else {
      console.log('Updating existing user:', user._id);
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
        },
        quota_used: user.youtube?.quota_used || 1 // Preserve existing quota or initialize
      };
      user.name = profile.name;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT token generated for user:', user._id);

    // Redirect based on state
    const redirectUrl = state === 'admin' 
      ? `${process.env.FRONTEND_URL?.trim()}/auth/callback?token=${token}`
      : `${process.env.FRONTEND_URL?.trim()}/auth/callback?token=${token}&state=${state}`;
    
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth callback error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    
    const errorMessage = encodeURIComponent(
      error.message || 'Failed to process OAuth callback'
    );
    res.redirect(`${process.env.FRONTEND_URL?.trim()}/auth/error?message=${errorMessage}`);
  }
};

exports.getChannelStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(404).json({ error: 'No YouTube connection found' });
    }

    // Check for fresh parameter
    const fresh = req.query.fresh === 'true';
    console.log('Channel stats request:', { fresh, userId: req.user.id });

    const stats = await youtubeApi.getChannelStats(user.youtube.access_token, { fresh });
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    
    if (err.message === 'No YouTube connection found') {
      return res.status(404).json({ error: 'YouTube account not connected' });
    }
    
    res.status(500).json({ error: 'Failed to fetch YouTube stats' });
  }
};

exports.getUserChannel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube) {
      return res.status(404).json({ error: 'No YouTube connection found' });
    }

    // Don't expose sensitive data
    const channelInfo = {
      channelId: user.youtube.channel_id,
      title: user.youtube.channel_title,
      profilePicture: user.youtube.profile_picture,
      stats: user.youtube.stats,
      connectedAt: user.youtube.connected_at,
      quotaUsed: user.youtube.quota_used
    };

    res.json(channelInfo);
  } catch (err) {
    console.error('Channel info error:', err);
    res.status(500).json({ error: 'Failed to fetch channel info' });
  }
};

exports.disconnectYouTube = async (req, res) => {
  console.log('Attempting to disconnect YouTube account...');
  console.log('User (from req.user): ', req.user ? req.user._id : 'Not found');

  if (!req.user) {
    console.error('Disconnect error: User not authenticated.');
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('Disconnect error: User not found in DB.', req.user._id);
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log('User found for disconnect. Checking YouTube tokens...');
    if (user.youtube && user.youtube.refresh_token) {
      console.log('Refresh token found. Attempting to revoke...');
      try {
        // Revoke the refresh token from Google
        await youtubeApi.revokeToken(user.youtube.refresh_token);
        console.log('Refresh token successfully revoked from Google.');
      } catch (revokeError) {
        console.error('Error revoking Google token:', revokeError.message);
        // Continue even if revocation fails, as we still want to clear our DB
      }
    } else {
      console.log('No YouTube refresh token found for this user.');
    }

    // Clear YouTube related fields from the user document
    user.youtube = undefined; // Or set to null/empty object depending on schema
    user.name = user.email; // Resetting name if it was from Google profile
    await user.save();
    console.log('User YouTube data cleared from DB.', user._id);

    res.status(200).json({ message: 'YouTube account disconnected successfully.' });
  } catch (error) {
    console.error('Disconnect YouTube error:', {
      message: error.message,
      stack: error.stack,
      code: error.code || 'N/A',
      status: error.status || 'N/A'
    });
    res.status(500).json({ error: 'Failed to disconnect YouTube account.' });
  }
};

// Get current quota usage
exports.getQuotaUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube) {
      return res.json({ quotaUsage: 0 });
    }

    // Return the quota usage. If not set, return 0
    res.json({ 
      quotaUsage: user.youtube.quota_used || 0 
    });
  } catch (err) {
    console.error('Quota usage error:', err);
    res.status(500).json({ error: 'Failed to fetch quota usage' });
  }
};

// New overview controller for dashboard data
exports.getOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube) {
      return res.status(404).json({ error: 'No YouTube connection found' });
    }

    // Check for fresh parameter to force new data fetch
    const fresh = req.query.fresh === 'true';
    console.log('Overview request:', { fresh, userId: req.user.id });

    // Get channel stats using the YouTubeAPI helper with fresh parameter
    const stats = await youtubeApi.getChannelStats(user.youtube.access_token, { fresh });
    
    // Calculate daily averages
    const daysSinceConnection = Math.max(1, 
      Math.ceil((new Date() - new Date(user.youtube.connected_at)) / (1000 * 60 * 60 * 24))
    );

    if (!stats) {
      throw new Error('Failed to fetch channel statistics');
    }
    
    console.log('Fetched fresh stats:', {
      viewCount: stats.viewCount,
      subscriberCount: stats.subscriberCount,
      videoCount: stats.videoCount,
      commentCount: stats.commentCount,
      uniqueAuthors: stats.uniqueAuthors,
      fresh
    });
    
    const overview = {
      totalChannels: 1, // One channel per user for now
      totalComments: stats.commentCount || 0,
      uniqueCommentAuthors: stats.uniqueAuthors || 0, // Use actual unique authors count
      avgCommentsPerDay: Math.round((stats.commentCount || 0) / daysSinceConnection),
      stats: {
        ...stats,
        lastUpdated: new Date()
      }
    };

    res.json(overview);
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
};