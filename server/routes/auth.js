const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { 
  requestEmailVerification, 
  completeRegistration, 
  grandAdminLogin,
  universalLogin
} = require('../controllers/authController');

// Google OAuth routes (no auth required)
router.get('/google', (req, res) => {
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'https://clean-dashboard.onrender.com/api/youtube/oauth2callback';
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const scope = encodeURIComponent([
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ].join(' '));
  
  // Generate state for CSRF protection
  const state = Buffer.from(Math.random().toString()).toString('base64');
  
  // Store state in session or cookie for verification
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${client_id}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&state=${state}` +
    `&prompt=consent`;

  console.log('Redirecting to Google OAuth:', { url, state });
  res.redirect(url);
});

// New: Mobile number login route
router.post('/login-phone', authController.loginWithMobileNumber);

// GrandAdmin registration and login endpoints (no auth required)
router.post('/request-email-verification', requestEmailVerification);
router.post('/complete-registration', completeRegistration);
router.post('/login', universalLogin);

// Protected routes (auth required)
router.use(auth);

// User routes
router.get('/me', authController.getCurrentUser);
router.get('/youtube/channel', authController.getYouTubeChannel);
router.get('/youtube/stats', authController.getYouTubeStats);
router.post('/youtube/refresh', authController.refreshYouTubeStats);

// GrandAdmin: Assign role (create user)
router.post('/grandadmin/assign-role', auth, authController.assignRole);
// GrandAdmin: Get all users
router.get('/grandadmin/users', auth, authController.getAllUsers);
// GrandAdmin: Delete user
router.delete('/grandadmin/delete-user/:id', auth, authController.deleteUser);
// GrandAdmin: Get all grandadmins
router.get('/grandadmin/list', auth, authController.getGrandAdmins);

module.exports = router;