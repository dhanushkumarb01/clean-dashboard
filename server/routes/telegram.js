const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');
const auth = require('../middleware/auth');
const { getMessageStats } = require('../controllers/telegramController');

// Public routes (no auth required for data storage from Python script)
router.post('/store-stats', telegramController.storeTelegramStats);
router.post('/store-messages', telegramController.storeTelegramMessages);

// Protected routes (auth required for frontend access)
router.use(auth);

// Telegram statistics routes
router.get('/stats', telegramController.getTelegramStats);
router.get('/most-active-users', telegramController.getMostActiveUsers);
router.get('/most-active-groups', telegramController.getMostActiveGroups);
router.get('/top-users-by-groups', telegramController.getTopUsersByGroups);
router.get('/stats-history', telegramController.getStatsHistory);
router.get('/user/:userId', telegramController.getUserReport);
router.get('/group/:groupId', telegramController.getGroupReport);
router.get('/report', telegramController.generateReport);

// ** NEW: Message Content Routes **
router.get('/messages', telegramController.getMessages);
router.get('/messages/flagged', telegramController.getFlaggedMessages);
router.get('/messages/chat/:chatId', telegramController.getMessagesByChat);
router.post('/messages/:messageId/flag', telegramController.flagMessage);
router.post('/messages/:messageId/unflag', telegramController.unflagMessage);
router.get('/messages/stats', getMessageStats);

// ** NEW: Law Enforcement Analytics Routes **
router.get('/suspicious-users', telegramController.getSuspiciousUsers);
router.get('/enhanced-analytics', telegramController.getEnhancedAnalytics);
router.get('/location-intelligence', telegramController.getLocationIntelligence);
router.get('/suspicious-user/:userId', telegramController.getSuspiciousUserReport);

// ** NEW: User Summary Routes **
router.get('/user/:userId/summary', telegramController.getUserSummary);

// Log route access in development
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log('Telegram route accessed:', {
      path: req.path,
      method: req.method,
      isAuthenticated: !!req.user,
      isPublicRoute: ['/store-stats'].includes(req.path)
    });
    next();
  });
}

module.exports = router;
