const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get current authenticated user
router.get('/me', userController.getCurrentUser);

// Update current user
router.put('/me', userController.updateCurrentUser);

// Get YouTube stats from all users
router.get('/youtube-stats', userController.getYouTubeStats);

// Get user by ID
router.get('/:id', userController.getUserById);

module.exports = router;
