const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middleware/auth');

// Public routes (for webhook - no auth required)
router.get('/webhook', whatsappController.handleWebhook); // Webhook verification
router.post('/webhook', whatsappController.handleWebhook); // Webhook messages

// Debug routes (development only - no auth required)
if (process.env.NODE_ENV === 'development') {
  // Test send message without auth - this calls the controller directly
  router.post('/test-send-message', whatsappController.sendMessage);

  // Check WhatsApp token status
  router.get('/check-token', async (req, res) => {
    try {
      const WhatsAppTokenManager = require('../utils/whatsappTokenManager');
      const tokenManager = new WhatsAppTokenManager();
      
      const validation = await tokenManager.validateToken();
      const tokenInfo = await tokenManager.getTokenInfo();
      
      res.json({
        success: true,
        data: {
          tokenValid: validation.valid,
          validation,
          tokenInfo,
          instructions: validation.valid ? null : tokenManager.getTokenRefreshInstructions()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Token check failed',
        message: error.message
      });
    }
  });

  // Test database connection
  router.get('/ping-db', async (req, res) => {
    try {
      const WhatsAppMessage = require('../models/WhatsAppMessage');
      
      // Try to insert a test message
      const testMessage = new WhatsAppMessage({
        messageId: `debug_test_${Date.now()}`,
        from: '+919999999999',
        to: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
        message: 'Database connection test',
        messageType: 'text',
        direction: 'incoming',
        status: 'read',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
        wabaId: process.env.WHATSAPP_WABA_ID || 'test_waba_id',
        contactName: 'Debug Test'
      });
      
      await testMessage.save();
      
      // Count total messages
      const totalMessages = await WhatsAppMessage.countDocuments();
      
      res.json({
        success: true,
        message: 'Database connection working!',
        data: {
          testMessageId: testMessage.messageId,
          totalMessagesInDB: totalMessages,
          dbConnection: 'OK'
        }
      });
      
    } catch (error) {
      console.error('Database ping error:', error);
      res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: error.message
      });
    }
  });

// Test route to add sample data (development only - no auth required)
  router.post('/add-test-data', async (req, res) => {
    try {
      const WhatsAppMessage = require('../models/WhatsAppMessage');
      const WhatsAppProfile = require('../models/WhatsAppProfile');
      
      console.log('Adding test WhatsApp data...');
      
      // Sample contacts
      const contacts = [
        { phone: '+919876543210', name: 'John Doe' },
        { phone: '+919876543211', name: 'Jane Smith' },
        { phone: '+919876543212', name: 'Bob Johnson' },
        { phone: '+919876543213', name: 'Alice Williams' }
      ];
      
      const messages = [];
      const now = new Date();
      
      // Create 20 sample messages
      for (let i = 0; i < 20; i++) {
        const contact = contacts[Math.floor(Math.random() * contacts.length)];
        const isIncoming = Math.random() > 0.5;
        const daysAgo = Math.floor(Math.random() * 7); // Last 7 days
        const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        const message = new WhatsAppMessage({
          messageId: `test_${Date.now()}_${i}`,
          from: isIncoming ? contact.phone : process.env.WHATSAPP_PHONE_NUMBER_ID,
          to: isIncoming ? process.env.WHATSAPP_PHONE_NUMBER_ID : contact.phone,
          message: `Test message ${i + 1}`,
          messageType: 'text',
          direction: isIncoming ? 'incoming' : 'outgoing',
          status: isIncoming ? 'read' : 'delivered',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          wabaId: process.env.WHATSAPP_WABA_ID,
          timestamp,
          contactName: contact.name
        });
        
        messages.push(message);
      }
      
      await WhatsAppMessage.insertMany(messages);
      
      // Create profile if it doesn't exist
      const existingProfile = await WhatsAppProfile.findOne({ wabaId: process.env.WHATSAPP_WABA_ID });
      if (!existingProfile) {
        const profile = new WhatsAppProfile({
          wabaId: process.env.WHATSAPP_WABA_ID,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          businessProfile: {
            name: 'Dhanush Business Account',
            verifiedName: 'Dhanush Business Account',
            displayPhoneNumber: '+919876543200'
          }
        });
        await profile.save();
      }
      
      const totalMessages = await WhatsAppMessage.countDocuments();
      
      res.json({
        success: true,
        message: `Added ${messages.length} test messages. Total messages: ${totalMessages}`,
        data: { totalMessages, addedMessages: messages.length }
      });
      
    } catch (error) {
      console.error('Error adding test data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add test data',
        details: error.message
      });
    }
  });
}

// Protected routes (auth required for frontend access)
router.use(auth);

// WhatsApp dashboard routes
router.get('/stats', whatsappController.getWhatsAppStats);
router.get('/messages', whatsappController.getRecentMessages);
router.get('/conversation/:phoneNumber', whatsappController.getConversation);
router.get('/report', whatsappController.generateReport);

// WhatsApp messaging routes
router.post('/send-message', whatsappController.sendMessage);

// Log route access in development
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log('WhatsApp route accessed:', {
      path: req.path,
      method: req.method,
      isAuthenticated: !!req.user,
      isPublicRoute: ['/webhook'].includes(req.path)
    });
    next();
  });
}

module.exports = router;
