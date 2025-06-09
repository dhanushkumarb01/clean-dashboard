const TelegramStats = require('../models/TelegramStats');

// Get latest Telegram statistics
const getTelegramStats = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching latest stats');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('-__v');
    
    if (!stats) {
      console.log('Telegram Controller - No stats found, returning empty data');
      return res.json({
        success: true,
        data: {
          totalGroups: 0,
          activeUsers: 0,
          totalUsers: 0,
          totalMessages: 0,
          totalMediaFiles: 0,
          messageRate: 0,
          rateChange: 0,
          groupPropagation: 0,
          avgViewsPerMessage: 0,
          mostActiveUsers: [],
          mostActiveGroups: [],
          topUsersByGroups: [],
          lastUpdated: null,
          isEmpty: true
        }
      });
    }
    
    console.log('Telegram Controller - Stats found:', {
      totalGroups: stats.totalGroups,
      totalMessages: stats.totalMessages,
      lastUpdated: stats.timestamp
    });
    
    res.json({
      success: true,
      data: {
        ...stats.toObject(),
        isEmpty: false,
        lastUpdated: stats.timestamp
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Telegram statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get most active users
const getMostActiveUsers = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching most active users');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('mostActiveUsers');
    
    if (!stats || !stats.mostActiveUsers) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: stats.mostActiveUsers
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching most active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch most active users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get most active groups
const getMostActiveGroups = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching most active groups');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('mostActiveGroups');
    
    if (!stats || !stats.mostActiveGroups) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: stats.mostActiveGroups
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching most active groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch most active groups',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get top users by groups joined
const getTopUsersByGroups = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching top users by groups');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('topUsersByGroups');
    
    if (!stats || !stats.topUsersByGroups) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: stats.topUsersByGroups
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching top users by groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top users by groups',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Store new Telegram statistics (called by Python script)
const storeTelegramStats = async (req, res) => {
  try {
    console.log('Telegram Controller - Storing new stats');
    
    const statsData = req.body;
    
    // Validate required fields
    if (!statsData || typeof statsData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
    }
    
    // Create new stats document
    const newStats = new TelegramStats({
      ...statsData,
      timestamp: statsData.timestamp ? new Date(statsData.timestamp) : new Date(),
      collectionPeriod: {
        start: statsData.collectionPeriod?.start ? new Date(statsData.collectionPeriod.start) : new Date(),
        end: statsData.collectionPeriod?.end ? new Date(statsData.collectionPeriod.end) : new Date()
      }
    });
    
    await newStats.save();
    
    console.log('Telegram Controller - Stats stored successfully:', {
      id: newStats._id,
      totalGroups: newStats.totalGroups,
      totalMessages: newStats.totalMessages,
      timestamp: newStats.timestamp
    });
    
    res.json({
      success: true,
      message: 'Telegram statistics stored successfully',
      data: {
        id: newStats._id,
        timestamp: newStats.timestamp
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error storing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store Telegram statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get statistics history (for charts/trends)
const getStatsHistory = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching stats history');
    const history = await TelegramStats.find()
      .sort({ timestamp: 1 })
      .limit(10) // Limit to last 10 entries for history for now
      .select('timestamp totalMessages totalUsers totalMediaFiles');

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching stats history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Telegram statistics history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getTelegramStats,
  getMostActiveUsers,
  getMostActiveGroups,
  getTopUsersByGroups,
  storeTelegramStats,
  getStatsHistory
}; 