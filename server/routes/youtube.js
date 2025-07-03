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

// Make report by authorChannelId public for debugging
router.get('/report/:authorChannelId', youtubeController.getAuthorReport);

// Protected routes (auth required) - Apply middleware to all routes below
router.use(auth); 

// YouTube data routes
router.get('/stats', youtubeController.getChannelStats);
router.get('/channel', youtubeController.getUserChannel);
router.get('/quota', youtubeController.getQuotaUsage);
router.get('/overview', youtubeController.getOverview);
router.get('/most-active-users', youtubeController.getMostActiveUsers);
router.get('/most-active-channels', youtubeController.getMostActiveChannels);
router.get('/channel/:channelId', youtubeController.getChannelStatistics);
router.get('/channel/:channelId/comments', youtubeController.getChannelCommentsAndAnalysis);
router.get('/report', youtubeController.generateReport);
router.post('/disconnect', youtubeController.disconnectYouTube);
router.get('/messages/analysis', youtubeController.getYouTubeMessageAnalysis);
router.get('/threats/stats', youtubeController.getYouTubeThreatStats);

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
