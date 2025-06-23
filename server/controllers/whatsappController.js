const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppProfile = require('../models/WhatsAppProfile');
const WhatsAppTokenManager = require('../utils/whatsappTokenManager');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const classifyMessagesByType = require('../utils/classifyMessagesByType');

// WhatsApp Cloud API configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WABA_ID = process.env.WHATSAPP_WABA_ID;

// Initialize token manager
const tokenManager = new WhatsAppTokenManager();

// Helper function to check if error is token expiration
const isTokenExpiredError = (error) => {
  return error.response?.data?.error?.code === 190 || 
         error.response?.data?.error?.type === 'OAuthException';
};

// Helper function to format token expiry error
const formatTokenError = (error) => {
  const errorData = error.response?.data?.error;
  if (errorData?.code === 190) {
    return {
      error: 'WhatsApp Access Token Expired',
      message: 'Your WhatsApp access token has expired and needs to be refreshed.',
      code: 190,
      instructions: {
        steps: [
          'Go to https://developers.facebook.com/',
          'Navigate to your WhatsApp Business app',
          'Go to WhatsApp > Getting Started',
          'Generate a new temporary access token',
          'Update WHATSAPP_ACCESS_TOKEN in your backend/.env file',
          'Restart your server'
        ],
        note: 'Temporary tokens expire every 24 hours. Consider upgrading to a system user token for longer expiry.'
      },
      technicalDetails: errorData
    };
  }
  return {
    error: 'WhatsApp API Error',
    message: errorData?.message || error.message || 'Unknown error',
    code: errorData?.code || 'UNKNOWN',
    technicalDetails: errorData
  };
};

// Get WhatsApp dashboard statistics
const getWhatsAppStats = async (req, res) => {
  try {
    console.log('WhatsApp Controller - Fetching dashboard stats');
    
    // Always fetch fresh data from MongoDB Atlas first
    let dbStats = {
      totalMessages: 0,
      totalSent: 0,
      totalReceived: 0,
      messages24h: 0,
      messages7d: 0,
      messages30d: 0,
      uniqueContacts: 0,
      recentMessages: [],
      mostActiveContacts: []
    };

    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log('Fetching stats from MongoDB Atlas...');

      const [
        totalMessages,
        totalSent,
        totalReceived,
        messages24h,
        messages7d,
        messages30d,
        uniqueContactsFrom,
        uniqueContactsTo,
        recentMessages,
        mostActiveContactsAgg
      ] = await Promise.all([
        WhatsAppMessage.countDocuments(),
        WhatsAppMessage.countDocuments({ direction: 'outgoing' }),
        WhatsAppMessage.countDocuments({ direction: 'incoming' }),
        WhatsAppMessage.countDocuments({ timestamp: { $gte: last24Hours } }),
        WhatsAppMessage.countDocuments({ timestamp: { $gte: last7Days } }),
        WhatsAppMessage.countDocuments({ timestamp: { $gte: last30Days } }),
        WhatsAppMessage.distinct('from'),
        WhatsAppMessage.distinct('to'),
        WhatsAppMessage.find()
          .sort({ timestamp: -1 })
          .limit(10)
          .select('from to message direction timestamp status contactName messageType'),
        
        // Get most active contacts aggregation
        WhatsAppMessage.aggregate([
          {
            $group: {
              _id: { $cond: [{ $eq: ['$direction', 'incoming'] }, '$from', '$to'] },
              messageCount: { $sum: 1 },
              lastMessage: { $max: '$timestamp' },
              contactName: { $first: '$contactName' }
            }
          },
          { $sort: { messageCount: -1 } },
          { $limit: 10 }
        ])
      ]);

      // Calculate unique contacts (from both from and to fields)
      const allContacts = new Set([...uniqueContactsFrom, ...uniqueContactsTo]);
      const uniqueContacts = allContacts.size;

      dbStats = {
        totalMessages,
        totalSent,
        totalReceived,
        messages24h,
        messages7d,
        messages30d,
        uniqueContacts,
        recentMessages,
        mostActiveContacts: mostActiveContactsAgg.map(contact => ({
          phoneNumber: contact._id,
          messageCount: contact.messageCount,
          lastMessage: contact.lastMessage,
          contactName: contact.contactName || contact._id
        }))
      };

      console.log('MongoDB Atlas stats fetched:', {
        totalMessages,
        totalSent,
        totalReceived,
        uniqueContacts,
        messages24h
      });

    } catch (dbError) {
      console.error('Database stats error:', dbError);
      // Don't fallback to static data, return empty stats instead
      dbStats = {
        totalMessages: 0,
        totalSent: 0,
        totalReceived: 0,
        messages24h: 0,
        messages7d: 0,
        messages30d: 0,
        uniqueContacts: 0,
        recentMessages: [],
        mostActiveContacts: []
      };
    }

    // Try to get stored profile data
    let storedProfile = null;
    try {
      storedProfile = await WhatsAppProfile.findOne({ wabaId: WABA_ID });
    } catch (dbError) {
      console.log('DB Error fetching stored profile');
    }

    // Fetch real WhatsApp Business account information from API
    let businessProfile = {};
    let phoneNumberInfo = {};
    
    try {
      // Get phone number information
      const phoneResponse = await axios.get(
        `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}`,
        {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        }
      );
      phoneNumberInfo = phoneResponse.data;
      
      // Get WhatsApp Business Account info
      if (WABA_ID) {
        const wabaResponse = await axios.get(
          `${WHATSAPP_API_URL}/${WABA_ID}`,
          {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
          }
        );
        businessProfile = wabaResponse.data;
      }
    } catch (apiError) {
      console.log('API Error fetching profile:', apiError.response?.data || apiError.message);
    }

    // Calculate average response time from real data
    const averageResponseTime = await calculateAverageResponseTime();

    // Calculate delivery rate based on message statuses
    let deliveryRate = 96; // Default
    if (dbStats.totalSent > 0) {
      try {
        const deliveredCount = await WhatsAppMessage.countDocuments({ 
          direction: 'outgoing', 
          status: { $in: ['delivered', 'read'] } 
        });
        deliveryRate = Math.round((deliveredCount / dbStats.totalSent) * 100);
      } catch (error) {
        console.log('Error calculating delivery rate:', error);
      }
    }

    // Build stats object using real MongoDB data
    const stats = {
      // Business Profile Information
      businessProfile: {
        name: businessProfile.name || storedProfile?.businessProfile?.name || 'WhatsApp Business',
        phoneNumber: phoneNumberInfo.display_phone_number || storedProfile?.businessProfile?.displayPhoneNumber || 'Not Available',
        phoneNumberId: PHONE_NUMBER_ID,
        wabaId: WABA_ID,
        displayPhoneNumber: phoneNumberInfo.display_phone_number || storedProfile?.businessProfile?.displayPhoneNumber || 'Not Available',
        verifiedName: phoneNumberInfo.verified_name || storedProfile?.businessProfile?.verifiedName || 'Dhanush Business Account',
        status: phoneNumberInfo.code_verification_status || storedProfile?.accountInfo?.codeVerificationStatus || 'VERIFIED'
      },
      
      // Use real database stats (no fallbacks to static data)
      totalMessages: dbStats.totalMessages,
      totalSent: dbStats.totalSent,
      totalReceived: dbStats.totalReceived,
      uniqueContacts: dbStats.uniqueContacts,
      messages24h: dbStats.messages24h,
      messages7d: dbStats.messages7d,
      messages30d: dbStats.messages30d,
      totalChats: dbStats.uniqueContacts, // Total chats = unique contacts
      
      // Performance Metrics (calculated from real data)
      deliveryRate,
      averageResponseTime,
      
      // Additional Stats
      statusBreakdown: await getStatusBreakdown(),
      mostActiveContacts: dbStats.mostActiveContacts,
      recentMessages: dbStats.recentMessages,
      lastUpdated: new Date(),
      isEmpty: dbStats.totalMessages === 0,
      
      // API Connection Status
      apiConnected: !!(ACCESS_TOKEN && PHONE_NUMBER_ID),
      apiStatus: phoneNumberInfo.id ? 'Connected' : (ACCESS_TOKEN ? 'API Connected' : 'Not Connected'),
      
      // Data source indicator
      dataSource: 'mongodb_atlas'
    };

    console.log('WhatsApp Controller - Real-time stats compiled from MongoDB Atlas:', {
      businessName: stats.businessProfile.verifiedName,
      phoneNumber: stats.businessProfile.phoneNumber,
      totalMessages: stats.totalMessages,
      totalChats: stats.totalChats,
      uniqueContacts: stats.uniqueContacts,
      apiConnected: stats.apiConnected,
      isEmpty: stats.isEmpty
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('WhatsApp Controller - Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WhatsApp statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Send WhatsApp message
const sendMessage = async (req, res) => {
  try {
    const { to, message, messageType = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({
        success: false,
        error: 'WhatsApp API credentials not configured'
      });
    }

    // Clean phone number (remove non-digits except +)
    const cleanPhoneNumber = to.replace(/[^\d+]/g, '');
    
    console.log('WhatsApp Controller - Sending message:', {
      to: cleanPhoneNumber,
      messageLength: message.length,
      messageType
    });

    // Prepare WhatsApp API request
    const whatsappPayload = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber,
      type: messageType,
      [messageType]: {
        body: message
      }
    };

    // Send message via WhatsApp Cloud API
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      whatsappPayload,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('WhatsApp API Response:', response.data);

    // Generate message ID for our database
    const messageId = response.data.messages?.[0]?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save message to database with enhanced debugging
    console.log('\n === SAVING MESSAGE TO DATABASE ===');
    const whatsappMessage = new WhatsAppMessage({
      messageId,
      from: PHONE_NUMBER_ID,
      to: cleanPhoneNumber,
      message,
      messageType,
      direction: 'outgoing',
      status: 'sent',
      phoneNumberId: PHONE_NUMBER_ID,
      wabaId: WABA_ID,
      sentAt: new Date(),
      webhookData: response.data
    });

    console.log('📝 Message object to save:', {
      messageId,
      from: PHONE_NUMBER_ID,
      to: cleanPhoneNumber,
      message: message.substring(0, 50) + '...',
      direction: 'outgoing',
      status: 'sent'
    });

    await whatsappMessage.save();
    console.log('✅ Message saved to database successfully:', messageId);
    
    // Verify save by querying
    const savedMessage = await WhatsAppMessage.findOne({ messageId });
    console.log('🔍 Verification - Message found in DB:', !!savedMessage);
    
    // Get current total count
    const totalMessages = await WhatsAppMessage.countDocuments();
    console.log('📊 Total messages in database now:', totalMessages);

    // Update WhatsApp Profile Analytics immediately
    await updateWhatsAppProfileStats();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId,
        to: cleanPhoneNumber,
        status: 'sent',
        timestamp: whatsappMessage.timestamp,
        whatsappResponse: response.data
      }
    });

  } catch (error) {
    console.error('WhatsApp Controller - Error sending message:', error);
    
    // Log the full error for debugging
    if (error.response) {
      console.error('WhatsApp API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    // Check if it's a token expiration error
    if (isTokenExpiredError(error)) {
      const tokenError = formatTokenError(error);
      return res.status(401).json({
        success: false,
        ...tokenError
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      message: error.response?.data?.error?.message || error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
};

// Webhook handler for receiving messages
const handleWebhook = async (req, res) => {
  try {
    // Enhanced debugging
    console.log('\n🔔 === WEBHOOK RECEIVED ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🔗 URL:', req.url);
    console.log('📝 Method:', req.method);
    console.log('🔧 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('❓ Query:', JSON.stringify(req.query, null, 2));

    const body = req.body;

    // Verify webhook (required by WhatsApp)
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook verification successful');
      console.log('🔑 Verify token matches:', req.query['hub.verify_token'] === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
      console.log('🎯 Challenge:', req.query['hub.challenge']);
      return res.status(200).send(req.query['hub.challenge']);
    }

    // Process incoming messages
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Process incoming messages
            if (value.messages) {
              value.messages.forEach(async (message) => {
                try {
                  await processIncomingMessage(message, value);
                } catch (error) {
                  console.error('Error processing incoming message:', error);
                }
              });
            }

            // Process message status updates
            if (value.statuses) {
              value.statuses.forEach(async (status) => {
                try {
                  await updateMessageStatus(status);
                } catch (error) {
                  console.error('Error updating message status:', error);
                }
              });
            }
          }
        });
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

// Helper function to process incoming messages
const processIncomingMessage = async (message, value) => {
  const contact = value.contacts?.[0];
  const messageId = message.id;
  
  // Check if message already exists
  const existingMessage = await WhatsAppMessage.findOne({ messageId });
  if (existingMessage) {
    console.log('Message already processed:', messageId);
    return;
  }

  const whatsappMessage = new WhatsAppMessage({
    messageId,
    from: message.from,
    to: value.metadata.phone_number_id,
    message: message.text?.body || message.caption || '[Media]',
    messageType: message.type,
    direction: 'incoming',
    status: 'read', // Use 'read' for incoming messages instead of 'received'
    phoneNumberId: value.metadata.phone_number_id,
    timestamp: new Date(parseInt(message.timestamp) * 1000),
    contactName: contact?.profile?.name,
    contactProfile: contact?.profile,
    webhookData: { message, contact, metadata: value.metadata }
  });

  await whatsappMessage.save();
  console.log('Incoming message saved:', messageId);
  
  // Update stats after receiving a message
  await updateWhatsAppProfileStats();
};

// Helper function to update message status
const updateMessageStatus = async (status) => {
  const messageId = status.id;
  const statusValue = status.status;
  const timestamp = new Date(parseInt(status.timestamp) * 1000);

  const updateFields = {
    status: statusValue,
    [`${statusValue}At`]: timestamp
  };

  const updatedMessage = await WhatsAppMessage.findOneAndUpdate(
    { messageId },
    { $set: updateFields },
    { new: true }
  );

  console.log('Message status updated:', { messageId, status: statusValue });
  
  // Update stats when delivery status changes (affects delivery rate)
  if (updatedMessage && ['delivered', 'read', 'failed'].includes(statusValue)) {
    await updateWhatsAppProfileStats();
  }
};

// Helper function to get status breakdown
const getStatusBreakdown = async () => {
  try {
    const statusStats = await WhatsAppMessage.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = {};
    statusStats.forEach(stat => {
      breakdown[stat._id] = stat.count;
    });

    return breakdown;
  } catch (error) {
    console.error('Error getting status breakdown:', error);
    return {};
  }
};

// Helper function to calculate average response time
const calculateAverageResponseTime = async () => {
  try {
    // This is a simplified calculation - you might want to make it more sophisticated
    const recentMessages = await WhatsAppMessage.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: 1 });

    if (recentMessages.length < 2) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < recentMessages.length; i++) {
      const current = recentMessages[i];
      const previous = recentMessages[i - 1];

      if (current.direction !== previous.direction) {
        const responseTime = current.timestamp - previous.timestamp;
        if (responseTime > 0 && responseTime < 24 * 60 * 60 * 1000) { // Less than 24 hours
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0; // Return in minutes
  } catch (error) {
    console.error('Error calculating response time:', error);
    return 0;
  }
};

// Get recent messages
const getRecentMessages = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await WhatsAppMessage.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('from to message direction timestamp status contactName messageType');

    const total = await WhatsAppMessage.countDocuments();

    res.json({
      success: true,
      data: {
        messages,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('WhatsApp Controller - Error fetching recent messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent messages',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get conversation with specific contact
const getConversation = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const messages = await WhatsAppMessage.find({
      $or: [
        { from: phoneNumber },
        { to: phoneNumber }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await WhatsAppMessage.countDocuments({
      $or: [
        { from: phoneNumber },
        { to: phoneNumber }
      ]
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first in conversation
        total,
        phoneNumber,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('WhatsApp Controller - Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to update WhatsApp Profile stats
const updateWhatsAppProfileStats = async () => {
  try {
    console.log('📊 === UPDATING WHATSAPP PROFILE STATS ===');
    
    // Calculate current stats from messages
    const [
      totalMessages,
      messagesSent,
      messagesReceived,
      uniqueContactsFrom,
      uniqueContactsTo,
      deliveredMessages
    ] = await Promise.all([
      WhatsAppMessage.countDocuments(),
      WhatsAppMessage.countDocuments({ direction: 'outgoing' }),
      WhatsAppMessage.countDocuments({ direction: 'incoming' }),
      WhatsAppMessage.distinct('from'),
      WhatsAppMessage.distinct('to'),
      WhatsAppMessage.countDocuments({ 
        direction: 'outgoing', 
        status: { $in: ['delivered', 'read'] } 
      })
    ]);

    // Calculate unique contacts and delivery rate
    const allContacts = new Set([...uniqueContactsFrom, ...uniqueContactsTo]);
    const totalContacts = allContacts.size;
    const deliveryRate = messagesSent > 0 ? Math.round((deliveredMessages / messagesSent) * 100) : 0;
    
    // Calculate average response time
    const averageResponseTime = await calculateAverageResponseTime();

    const statsUpdate = {
      'analytics.totalMessages': totalMessages,
      'analytics.messagesSent': messagesSent,
      'analytics.messagesReceived': messagesReceived,
      'analytics.totalContacts': totalContacts,
      'analytics.totalChats': totalContacts,
      'analytics.deliveryRate': deliveryRate,
      'analytics.averageResponseTime': averageResponseTime,
      'apiStatus.lastSync': new Date(),
      'lastUpdated': new Date()
    };

    console.log('📈 Stats to update:', {
      totalMessages,
      messagesSent,
      messagesReceived,
      totalContacts,
      deliveryRate,
      averageResponseTime
    });

    // Update or create WhatsApp Profile with new stats
    const updatedProfile = await WhatsAppProfile.findOneAndUpdate(
      { wabaId: WABA_ID },
      { 
        $set: statsUpdate,
        $setOnInsert: {
          wabaId: WABA_ID,
          phoneNumberId: PHONE_NUMBER_ID,
          createdAt: new Date()
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    console.log('✅ WhatsApp Profile stats updated successfully:', {
      profileId: updatedProfile._id,
      totalMessages: updatedProfile.analytics.totalMessages,
      totalContacts: updatedProfile.analytics.totalContacts,
      lastUpdated: updatedProfile.lastUpdated
    });

    return updatedProfile;
  } catch (error) {
    console.error('❌ Error updating WhatsApp Profile stats:', error);
    // Don't throw error, just log it so message sending doesn't fail
    return null;
  }
};

// Generate PDF report
const generateReport = async (req, res) => {
  try {
    console.log('WhatsApp Controller - Generating PDF report');
    
    // Fetch latest WhatsApp statistics from the database
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      totalMessages,
      messagesSent,
      messagesReceived,
      messages24h,
      messages7d,
      uniqueContactsFrom,
      uniqueContactsTo,
      deliveredMessages,
      userCount
    ] = await Promise.all([
      WhatsAppMessage.countDocuments(),
      WhatsAppMessage.countDocuments({ direction: 'outgoing' }),
      WhatsAppMessage.countDocuments({ direction: 'incoming' }),
      WhatsAppMessage.countDocuments({ timestamp: { $gte: last24Hours } }),
      WhatsAppMessage.countDocuments({ timestamp: { $gte: last7Days } }),
      WhatsAppMessage.distinct('from'),
      WhatsAppMessage.distinct('to'),
      WhatsAppMessage.countDocuments({ 
        direction: 'outgoing', 
        status: { $in: ['delivered', 'read'] } 
      }),
      WhatsAppMessage.distinct('from').then(users => users.length)
    ]);
    
    // Calculate derived metrics
    const allContacts = new Set([...uniqueContactsFrom, ...uniqueContactsTo]);
    const distinctContacts = allContacts.size;
    const deliveryRate = messagesSent > 0 ? Math.round((deliveredMessages / messagesSent) * 100) : 0;
    const averageResponseTime = await calculateAverageResponseTime();
    
    // Set response headers before creating PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=WhatsApp_Report_${timestamp}.pdf`);
    
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
    doc.fontSize(20).font('Helvetica-Bold').text('WhatsApp Analytics Report', { align: 'center' });
    doc.fontSize(12).font('Helvetica');
    doc.text(`Report generated for: ${req.user.name || 'Unknown User'} ${req.user.email || 'No email'}`, { align: 'center' });
    doc.text(`Generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Move to table section
    let currentY = doc.y + 30;
    
    // 2. WhatsApp Statistics Table
    doc.fontSize(16).font('Helvetica-Bold').text('WhatsApp Statistics', 50, currentY);
    currentY += 25;
    
    const tableData = [
      ['Metric', 'Value'], // Header
      ['Total Messages', totalMessages.toLocaleString()],
      ['Messages Sent', messagesSent.toLocaleString()],
      ['Messages Received', messagesReceived.toLocaleString()],
      ['Total Unique Users', userCount.toLocaleString()],
      ['Delivery Rate', `${deliveryRate}%`],
      ['Average Response Time', `${averageResponseTime} min`],
      ['Distinct Contacts Messaged', distinctContacts.toLocaleString()],
      ['Recent Messages (24h)', messages24h.toLocaleString()],
      ['Recent Messages (7 days)', messages7d.toLocaleString()]
    ];
    
    currentY = drawTable(100, currentY, 400, tableData.length, tableData);
    
    // Finalize the PDF
    doc.end();
    
    console.log('WhatsApp Controller - PDF report generated successfully');
    
  } catch (error) {
    console.error('WhatsApp Controller - Error generating PDF report:', error);
    
    // Ensure response is not already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate WhatsApp report',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// GET /api/whatsapp/messages/analysis
const getWhatsAppMessageAnalysis = async (req, res) => {
  try {
    const messages = await WhatsAppMessage.find({});
    const classified = classifyMessagesByType(messages);
    res.json({
      categories: {
        safe: classified.safe,
        fraud: classified.fraud,
        sensitive: classified.sensitive,
        spam: classified.spam,
        other: classified.other,
        flagged: classified.flagged,
        highRisk: classified.highRisk,
        mediumRisk: classified.mediumRisk,
        lowRisk: classified.lowRisk
      },
      stats: classified.stats
    });
  } catch (err) {
    console.error('WhatsApp Message Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze WhatsApp messages' });
  }
};

// GET /api/whatsapp/threats/stats
const getWhatsAppThreatStats = async (req, res) => {
  try {
    const messages = await WhatsAppMessage.find({});
    const classified = classifyMessagesByType(messages);
    // Threat stats summary
    const stats = classified.stats;
    res.json({
      flaggedMessages: stats.flagged,
      highRiskMessages: stats.highRisk,
      mediumRiskMessages: stats.mediumRisk,
      lowRiskMessages: stats.lowRisk,
      totalMessages: stats.total,
      fraud: stats.fraud,
      sensitive: stats.sensitive,
      spam: stats.spam,
      safe: stats.safe,
      avgRiskScore: messages.length ? (messages.reduce((sum, m) => sum + (m.riskScore || 0), 0) / messages.length) : 0
    });
  } catch (err) {
    console.error('WhatsApp Threat Stats Error:', err);
    res.status(500).json({ error: 'Failed to get WhatsApp threat stats' });
  }
};

module.exports = {
  getWhatsAppStats,
  sendMessage,
  handleWebhook,
  getRecentMessages,
  getConversation,
  updateWhatsAppProfileStats,
  generateReport,
  getWhatsAppMessageAnalysis,
  getWhatsAppThreatStats
};
