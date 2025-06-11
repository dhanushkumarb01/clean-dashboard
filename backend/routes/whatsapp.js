const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middleware/auth');

// Public routes (for webhook - no auth required)
router.get('/webhook', whatsappController.handleWebhook); // Webhook verification
router.post('/webhook', whatsappController.handleWebhook); // Webhook messages

// Protected routes (auth required for frontend access)
router.use(auth);

// WhatsApp dashboard routes
router.get('/stats', whatsappController.getWhatsAppStats);
router.get('/messages', whatsappController.getRecentMessages);
router.get('/conversation/:phoneNumber', whatsappController.getConversation);

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
