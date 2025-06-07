const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');

// Start OAuth2 login
router.get('/login', youtubeController.login);

// OAuth2 callback
router.get('/oauth2callback', youtubeController.oauth2callback);

// Dashboard stats
router.get('/dashboard', youtubeController.getDashboardStats);

// Most active users
router.get('/users', youtubeController.getMostActiveUsers);

// Detailed user stats
router.get('/user/:id', youtubeController.getUserDetails);

module.exports = router;
