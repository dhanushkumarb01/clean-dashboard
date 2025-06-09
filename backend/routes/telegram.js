const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');
const auth = require('../middleware/auth');

// Public routes (no auth required for data storage from Python script)
router.post('/store-stats', telegramController.storeTelegramStats);

// Protected routes (auth required for frontend access)
router.use(auth);

// Telegram statistics routes
router.get('/stats', telegramController.getTelegramStats);
router.get('/most-active-users', telegramController.getMostActiveUsers);
router.get('/most-active-groups', telegramController.getMostActiveGroups);
router.get('/top-users-by-groups', telegramController.getTopUsersByGroups);
router.get('/stats-history', telegramController.getStatsHistory);

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