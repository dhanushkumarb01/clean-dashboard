const TelegramStats = require('../models/TelegramStats');
const PDFDocument = require('pdfkit');
const TelegramMessage = require('../models/TelegramMessage');

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
    console.log('Incoming Telegram stats data (req.body):', JSON.stringify(req.body, null, 2));
    
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

const getUserReport = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Telegram Controller - Fetching user report for userId: ${userId}`);

    const latestStats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('mostActiveUsers');

    if (!latestStats || !latestStats.mostActiveUsers) {
      return res.status(404).json({
        success: false,
        error: 'No active user data available or user not found.'
      });
    }

    const user = latestStats.mostActiveUsers.find(u => String(u.userId) === String(userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Telegram user not found.'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(`Telegram Controller - Error fetching user report for ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Telegram user report',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getGroupReport = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log(`Telegram Controller - Fetching group report for groupId: ${groupId}`);

    const latestStats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('mostActiveGroups');

    if (!latestStats || !latestStats.mostActiveGroups) {
      return res.status(404).json({
        success: false,
        error: 'No active group data available or group not found.'
      });
    }

    const group = latestStats.mostActiveGroups.find(g => String(g.groupId) === String(groupId));

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Telegram group not found.'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error(`Telegram Controller - Error fetching group report for ${req.params.groupId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Telegram group report',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Generate PDF report
const generateReport = async (req, res) => {
  try {
    console.log('Telegram Controller - Generating PDF report');
    
    // Fetch the latest Telegram statistics
    const stats = await TelegramStats.findOne().sort({ timestamp: -1 });
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'No Telegram statistics available for report generation'
      });
    }
    
    // Set response headers before creating PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Telegram_Report_${timestamp}.pdf`);
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Pipe the PDF to the response immediately
    doc.pipe(res);
    
    // Helper function to draw table
    const drawTable = (x, y, width, rows, data) => {
      const rowHeight = 25;
      const colWidth = width * 0.65; // 65% for metric, 35% for value
      
      // Draw table border
      doc.rect(x, y, width, rows * rowHeight).stroke();
      
      // Draw column separator
      doc.moveTo(x + colWidth, y).lineTo(x + colWidth, y + (rows * rowHeight)).stroke();
      
      // Draw row separators
      for (let i = 1; i < rows; i++) {
        doc.moveTo(x, y + i * rowHeight).lineTo(x + width, y + i * rowHeight).stroke();
      }
      
      // Fill data
      data.forEach((row, index) => {
        const rowY = y + (index * rowHeight) + 7;
        
        if (index === 0) {
          // Header row
          doc.fontSize(12).font('Helvetica-Bold');
        } else {
          doc.fontSize(11).font('Helvetica');
        }
        
        // Metric column
        doc.text(row[0], x + 10, rowY, { width: colWidth - 20 });
        
        // Value column
        doc.font('Helvetica-Bold').text(row[1], x + colWidth + 10, rowY, { width: width - colWidth - 20 });
        doc.font('Helvetica');
      });
      
      return y + (rows * rowHeight) + 20;
    };
    
    // 1. Report Title and User Info
    doc.fontSize(20).font('Helvetica-Bold').text('Telegram Analytics Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica');
    doc.text(`Report generated for: ${req.user.name || 'Unknown User'} ${req.user.email || 'No email'}`, { align: 'center' });
    doc.text(`Generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Move to table section
    let currentY = doc.y + 30;
    
    // 2. Statistics Overview Table
    doc.fontSize(16).font('Helvetica-Bold').text('Statistics Overview', 50, currentY);
    currentY += 25;
    
    const tableData = [
      ['Metric', 'Value'], // Header
      ['Total Groups', (stats.totalGroups || 0).toLocaleString()],
      ['Total Users', (stats.totalUsers || 0).toLocaleString()],
      ['Active Users', (stats.activeUsers || 0).toLocaleString()],
      ['Total Messages', (stats.totalMessages || 0).toLocaleString()],
      ['Media Files', (stats.totalMediaFiles || 0).toLocaleString()],
      ['Avg Views / Message', (stats.avgViewsPerMessage || 0).toLocaleString()],
      ['Group Propagation Rate', `${(stats.groupPropagation || 0).toFixed(2)}%`],
      ['Message Rate (per day)', `${stats.messageRate || 0}`]
    ];
    
    currentY = drawTable(100, currentY, 400, tableData.length, tableData);
    
    // 3. Top 5 Active Users Table
    doc.fontSize(16).font('Helvetica-Bold').text('Top 5 Active Users', 50, currentY);
    currentY += 25;
    
    const topUsers = (stats.mostActiveUsers || []).slice(0, 5);
    if (topUsers.length > 0) {
      const usersTableData = [
        ['User', 'Messages'] // Header
      ];
      
      topUsers.forEach((user) => {
        const username = user.username ? `@${user.username}` : (user.firstName || 'Unknown User');
        const displayName = username.length > 35 ? username.substring(0, 32) + '...' : username;
        usersTableData.push([displayName, (user.messageCount || 0).toLocaleString()]);
      });
      
      currentY = drawTable(100, currentY, 400, usersTableData.length, usersTableData);
    } else {
      doc.fontSize(11).font('Helvetica-Oblique').text('No active users data available', 70, currentY);
      currentY += 25;
    }
    
    // 4. Top 5 Active Groups Table
    doc.fontSize(16).font('Helvetica-Bold').text('Top 5 Active Groups', 50, currentY);
    currentY += 25;
    
    const topGroups = (stats.mostActiveGroups || []).slice(0, 5);
    if (topGroups.length > 0) {
      const groupsTableData = [
        ['Group', 'Messages'] // Header
      ];
      
      topGroups.forEach((group) => {
        const groupName = group.title || 'Unknown Group';
        const displayName = groupName.length > 35 ? groupName.substring(0, 32) + '...' : groupName;
        groupsTableData.push([displayName, (group.messageCount || 0).toLocaleString()]);
      });
      
      currentY = drawTable(100, currentY, 400, groupsTableData.length, groupsTableData);
    } else {
      doc.fontSize(11).font('Helvetica-Oblique').text('No active groups data available', 70, currentY);
    }
    
    // Finalize the PDF
    doc.end();
    
    console.log('Telegram Controller - PDF report generated successfully');
    
  } catch (error) {
    console.error('Telegram Controller - Error generating PDF report:', error);
    
    // Ensure response is not already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Telegram report',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// ** NEW: Law Enforcement Analytics Endpoints **

// Get suspicious users flagged by keyword analysis
const getSuspiciousUsers = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching suspicious users');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('suspiciousUsers totalSuspiciousUsers');
    
    if (!stats || !stats.suspiciousUsers) {
      return res.json({
        success: true,
        data: {
          suspiciousUsers: [],
          totalSuspiciousUsers: 0,
          isEmpty: true
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        suspiciousUsers: stats.suspiciousUsers,
        totalSuspiciousUsers: stats.totalSuspiciousUsers || stats.suspiciousUsers.length,
        isEmpty: false
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching suspicious users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suspicious users',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get enhanced analytics metrics
const getEnhancedAnalytics = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching enhanced analytics');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('mostActiveUserLast7Days avgMessagesPerDay peakHourOfActivity messageGrowthLast7Days keywordCloud');
    
    if (!stats) {
      return res.json({
        success: true,
        data: {
          mostActiveUserLast7Days: null,
          avgMessagesPerDay: 0,
          peakHourOfActivity: 0,
          messageGrowthLast7Days: 0,
          keywordCloud: [],
          isEmpty: true
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        mostActiveUserLast7Days: stats.mostActiveUserLast7Days || null,
        avgMessagesPerDay: stats.avgMessagesPerDay || 0,
        peakHourOfActivity: stats.peakHourOfActivity || 0,
        messageGrowthLast7Days: stats.messageGrowthLast7Days || 0,
        keywordCloud: stats.keywordCloud || [],
        isEmpty: false
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching enhanced analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get location intelligence data
const getLocationIntelligence = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching location intelligence');
    
    const stats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('topUserLocations');
    
    if (!stats || !stats.topUserLocations) {
      return res.json({
        success: true,
        data: {
          topUserLocations: [],
          hasLocationData: false
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        topUserLocations: stats.topUserLocations,
        hasLocationData: stats.topUserLocations.length > 0
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching location intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location intelligence',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get detailed suspicious user report
const getSuspiciousUserReport = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Telegram Controller - Fetching suspicious user report for userId: ${userId}`);

    const latestStats = await TelegramStats.findOne()
      .sort({ timestamp: -1 })
      .select('suspiciousUsers');

    if (!latestStats || !latestStats.suspiciousUsers) {
      return res.status(404).json({
        success: false,
        error: 'No suspicious user data available or user not found.'
      });
    }

    const suspiciousUser = latestStats.suspiciousUsers.find(u => u.userId === userId);

    if (!suspiciousUser) {
      return res.status(404).json({
        success: false,
        error: 'Suspicious user not found.'
      });
    }

    res.json({
      success: true,
      data: suspiciousUser
    });
  } catch (error) {
    console.error(`Telegram Controller - Error fetching suspicious user report for ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suspicious user report',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ** NEW: Message Content Management Functions **

// Store Telegram messages (called by Python script)
const storeTelegramMessages = async (req, res) => {
  try {
    console.log('Telegram Controller - Storing new messages');
    console.log('Incoming message count:', req.body.messages?.length || 0);
    
    const { messages } = req.body;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format - messages array required'
      });
    }
    
    const TelegramMessage = require('../models/TelegramMessage');
    let stored = 0;
    let errors = 0;
    
    // Process messages in batch
    for (const messageData of messages) {
      try {
        // Create new message document
        const newMessage = new TelegramMessage({
          ...messageData,
          timestamp: new Date(messageData.timestamp),
          editedTimestamp: messageData.editedTimestamp ? new Date(messageData.editedTimestamp) : null
        });
        
        await newMessage.save();
        stored++;
        
      } catch (error) {
        // Handle duplicate key errors gracefully
        if (error.code === 11000) {
          console.log(`Duplicate message skipped: ${messageData.messageId}`);
        } else {
          console.error('Error storing individual message:', error);
          errors++;
        }
      }
    }
    
    console.log(`Telegram Controller - Messages stored: ${stored}, errors: ${errors}`);
    
    res.json({
      success: true,
      message: 'Telegram messages stored successfully',
      stored: stored,
      errors: errors,
      total: messages.length
    });
  } catch (error) {
    console.error('Telegram Controller - Error storing messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store Telegram messages',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get messages with pagination and filtering
const getMessages = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching messages');
    
    const TelegramMessage = require('../models/TelegramMessage');
    
    // Query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const chatId = req.query.chatId;
    const flagged = req.query.flagged === 'true';
    const riskScore = req.query.riskScore;
    
    // Build query
    let query = {};
    if (chatId) query.chatId = chatId;
    if (flagged) query.isFlagged = true;
    if (riskScore) query.riskScore = { $gte: parseInt(riskScore) };
    
    // Execute query with pagination
    const messages = await TelegramMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');
    
    // Get total count for pagination
    const totalMessages = await TelegramMessage.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get flagged messages
const getFlaggedMessages = async (req, res) => {
  try {
    console.log('Telegram Controller - Fetching flagged messages');
    
    const TelegramMessage = require('../models/TelegramMessage');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await TelegramMessage.find({ isFlagged: true })
      .sort({ riskScore: -1, timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const totalFlagged = await TelegramMessage.countDocuments({ isFlagged: true });
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalFlagged,
          pages: Math.ceil(totalFlagged / limit)
        }
      }
    });
  } catch (error) {
    console.error('Telegram Controller - Error fetching flagged messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged messages',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get messages by chat ID
const getMessagesByChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log(`Telegram Controller - Fetching messages for chat: ${chatId}`);
    
    const TelegramMessage = require('../models/TelegramMessage');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    
    const messages = await TelegramMessage.find({ chatId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const totalMessages = await TelegramMessage.countDocuments({ chatId });
    
    // Get chat info from first message
    const chatInfo = messages.length > 0 ? {
      chatId: messages[0].chatId,
      chatName: messages[0].chatName,
      chatType: messages[0].chatType
    } : null;
    
    res.json({
      success: true,
      data: {
        messages,
        chatInfo,
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    console.error(`Telegram Controller - Error fetching messages for chat ${req.params.chatId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat messages',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Flag a message
const flagMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    
    console.log(`Telegram Controller - Flagging message: ${messageId}`);
    
    const TelegramMessage = require('../models/TelegramMessage');
    
    const message = await TelegramMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    message.isFlagged = true;
    message.flagReason = reason || 'Manually flagged by user';
    message.flaggedBy = req.user.id;
    message.flaggedAt = new Date();
    
    await message.save();
    
    res.json({
      success: true,
      message: 'Message flagged successfully',
      data: message
    });
  } catch (error) {
    console.error(`Telegram Controller - Error flagging message ${req.params.messageId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to flag message',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Unflag a message
const unflagMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    console.log(`Telegram Controller - Unflagging message: ${messageId}`);
    
    const TelegramMessage = require('../models/TelegramMessage');
    
    const message = await TelegramMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    message.isFlagged = false;
    message.flagReason = null;
    message.flaggedBy = null;
    message.flaggedAt = null;
    
    await message.save();
    
    res.json({
      success: true,
      message: 'Message unflagged successfully',
      data: message
    });
  } catch (error) {
    console.error(`Telegram Controller - Error unflagging message ${req.params.messageId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to unflag message',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Telegram user summary (for user profile page)
const getUserSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    // 1. Get latest stats document
    const latestStats = await TelegramStats.findOne().sort({ timestamp: -1 });
    // 2. Find user in mostActiveUsers
    let statsUser = null;
    if (latestStats && latestStats.mostActiveUsers) {
      statsUser = latestStats.mostActiveUsers.find(u => String(u.userId) === String(userId));
    }
    // 3. Get latest message for up-to-date name/username
    const latestMsg = await TelegramMessage.findOne({ senderId: userId }).sort({ timestamp: -1 });
    // 4. Get all unique groups
    const groups = await TelegramMessage.distinct('chatId', { senderId: userId });
    // 5. Get last active time
    const lastActive = latestMsg ? latestMsg.timestamp : null;
    // 6. Get recent messages
    const recentMessagesRaw = await TelegramMessage.find({ senderId: userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('messageText timestamp chatName');
    const recentMessages = recentMessagesRaw.map(msg => ({
      id: msg._id,
      text: msg.messageText,
      date: msg.timestamp,
      chatName: msg.chatName
    }));
    // 7. Compose response
    res.json({
      success: true,
      data: {
        telegramId: userId,
        username: latestMsg?.senderUsername || statsUser?.username || '',
        firstName: latestMsg?.senderFirstName || statsUser?.firstName || '',
        lastName: latestMsg?.senderLastName || statsUser?.lastName || '',
        bio: statsUser?.bio || '',
        messageCount: statsUser?.messageCount || await TelegramMessage.countDocuments({ senderId: userId }),
        groupCount: groups.length,
        lastActive,
        risk: statsUser?.risk || 'Low Risk',
        riskColor: statsUser?.riskColor || 'success',
        recentMessages
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram user summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getTelegramStats,
  getMostActiveUsers,
  getMostActiveGroups,
  getTopUsersByGroups,
  storeTelegramStats,
  getStatsHistory,
  getUserReport,
  getGroupReport,
  generateReport,
  // New law enforcement analytics endpoints
  getSuspiciousUsers,
  getEnhancedAnalytics,
  getLocationIntelligence,
  getSuspiciousUserReport,
  // New message content endpoints
  storeTelegramMessages,
  getMessages,
  getFlaggedMessages,
  getMessagesByChat,
  flagMessage,
  unflagMessage,
  getUserSummary,
};
