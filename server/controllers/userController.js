const User = require('../models/User');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user data'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your user account was not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch your user data'
    });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    // Don't allow email updates through this endpoint
    delete updateData.password;
    delete updateData.youtube;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your user account was not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user data'
    });
  }
};

exports.getYouTubeStats = async (req, res) => {
  try {
    console.log('📊 Fetching YouTube stats from users collection...');
    
    // Fetch all users with YouTube data
    const users = await User.find(
      { 'youtube.channel_id': { $exists: true } },
      {
        email: 1,
        name: 1,
        'youtube.channel_title': 1,
        'youtube.profile_picture': 1,
        'youtube.stats': 1,
        'youtube.connected_at': 1
      }
    );

    // Transform the data for the frontend
    const userStats = users.map(user => ({
      email: user.email,
      name: user.name,
      channelTitle: user.youtube?.channel_title || 'YouTube Channel',
      profilePicture: user.youtube?.profile_picture,
      subscriberCount: user.youtube?.stats?.subscriberCount || 0,
      viewCount: user.youtube?.stats?.viewCount || 0,
      videoCount: user.youtube?.stats?.videoCount || 0,
      commentCount: user.youtube?.stats?.commentCount || 0,
      lastUpdated: user.youtube?.stats?.lastUpdated || user.youtube?.connected_at,
      connectedAt: user.youtube?.connected_at
    }));

    console.log(`📈 Found ${userStats.length} users with YouTube data`);
    res.json(userStats);
  } catch (err) {
    console.error('Get YouTube stats error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch YouTube statistics'
    });
  }
};
