const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');

// Health check
router.get('/health', instagramController.healthCheck);

// Instagram profile
router.get('/profile', instagramController.getProfile);

// Instagram media
router.get('/media', instagramController.getMedia);

// Instagram stories
router.get('/stories', instagramController.getStories);

// Instagram analytics
router.get('/analytics', instagramController.getAnalytics);

// Media insights
router.get('/insights/:mediaId', instagramController.getMediaInsights);

// Media comments
router.get('/comments/:mediaId', instagramController.getMediaComments);

// Cache clear
router.post('/cache/clear', instagramController.clearCache);

// Cache status
router.get('/cache/status', instagramController.getCacheStatus);

module.exports = router; 