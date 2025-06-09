const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const auth = require('../middleware/auth');

// Temporary test route - REMOVE AFTER DEBUGGING
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.status(200).json({ message: 'YouTube API base path is working!' });
});

// Public OAuth routes (no auth required)
// The /oauth2callback route has been MOVED to backend/routes/auth.js
router.get('/login', youtubeController.getAuthUrl);

// Protected routes (auth required) - Apply middleware to all routes below
router.use(auth); 

// YouTube data routes
router.get('/stats', youtubeController.getChannelStats);
router.get('/channel', youtubeController.getUserChannel);
router.get('/quota', youtubeController.getQuotaUsage);
router.get('/overview', youtubeController.getOverview);
router.post('/disconnect', youtubeController.disconnectYouTube);

// Log route access in development
if (process.env.NODE_ENV === 'development') {
  router.use((req, res, next) => {
    console.log('YouTube route accessed:', {
      path: req.path,
      method: req.method,
      isAuthenticated: !!req.user,
      isPublicRoute: ['/login'].includes(req.path) // /oauth2callback removed
    });
    next();
  });
}

module.exports = router;