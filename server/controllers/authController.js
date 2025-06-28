const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.googleCallback = async (req, res) => {
  console.log('--> googleCallback function started');
  try {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    // Verify state to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { received: state, stored: storedState });
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Invalid state parameter')}`);
    }

    // Clear the state cookie
    res.clearCookie('oauth_state');

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('No authorization code provided')}`);
    }

    const redirectUriForExchange = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUriForExchange) {
      console.error('Missing GOOGLE_REDIRECT_URI in .env for token exchange');
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Backend configuration error: Missing Google Redirect URI')}`);
    }

    console.log('Exchanging code for tokens:', {
      hasCode: !!code,
      redirectUri: redirectUriForExchange
    });

    const tokenExchangeParams = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUriForExchange,
    };

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: tokenExchangeParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokens = tokenResponse.data;
    console.log('Received tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Get user profile
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = userInfoResponse.data;

    // Create OAuth client for YouTube API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });

    // Create YouTube API client with OAuth credentials
    const youtube = google.youtube({ 
      version: 'v3', 
      auth: oauth2Client 
    });

    // Get YouTube channel info
    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!channelData.items?.length) {
      throw new Error('No YouTube channel found for this user');
    }

    const channel = channelData.items[0];
    console.log('Retrieved channel data:', {
      id: channel.id,
      title: channel.snippet.title,
      hasStats: !!channel.statistics
    });

    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.email });
      if (user) {
        user.googleId = profile.id;
      } else {
        user = new User({
          email: profile.email,
          googleId: profile.id,
          name: profile.name,
          picture: profile.picture
        });
      }
    }

    // Update user's YouTube data
    user.youtube = {
      google_email: profile.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      channel_id: channel.id,
      connected_at: new Date(),
      channel_title: channel.snippet.title,
      profile_picture: channel.snippet.thumbnails.default.url,
      stats: {
        viewCount: parseInt(channel.statistics.viewCount),
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        lastUpdated: new Date()
      }
    };

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', {
      message: err.message,
      code: err.code,
      status: err.status,
      response: err.response?.data
    });
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message)}`);
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account was not found'
      });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      hasYouTube: !!user.youtube,
      lastLogin: user.lastLogin,
      youtube: user.youtube ? {
        channelTitle: user.youtube.channel_title,
        profilePicture: user.youtube.profile_picture,
        stats: user.youtube.stats
      } : null
    });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      error: 'User fetch failed',
      message: 'Failed to fetch user data'
    });
  }
};

exports.refreshYouTubeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    // Initialize oauth2Client here for token refresh and API calls
    const oauth2ClientForRefresh = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI // Use the same redirect URI
    );
    oauth2ClientForRefresh.setCredentials({
      access_token: user.youtube.access_token,
      refresh_token: user.youtube.refresh_token,
      expiry_date: user.youtube.expiry_date
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2ClientForRefresh
    });

    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });

    if (!channelData.items?.length) {
      return res.status(404).json({ error: 'No YouTube channel found' });
    }

    const channel = channelData.items[0];

    // Update user's YouTube stats
    user.youtube.stats = {
      viewCount: parseInt(channel.statistics.viewCount),
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      lastUpdated: new Date()
    };
    user.youtube.last_stats_update = new Date();

    await user.save();

    res.json({ success: true, message: 'YouTube stats refreshed', stats: user.youtube.stats });
  } catch (err) {
    console.error('Error refreshing YouTube stats:', err);
    res.status(500).json({
      error: 'Failed to refresh YouTube stats',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getYouTubeChannel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    res.json({
      channelTitle: user.youtube.channel_title,
      profilePicture: user.youtube.profile_picture,
      channelId: user.youtube.channel_id,
    });
  } catch (err) {
    console.error('Get YouTube channel error:', err);
    res.status(500).json({ error: 'Failed to get YouTube channel info' });
  }
};

exports.getYouTubeStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.youtube?.access_token) {
      return res.status(401).json({ error: 'YouTube not connected' });
    }

    res.json(user.youtube.stats);
  } catch (err) {
    console.error('Get YouTube stats error:', err);
    res.status(500).json({ error: 'Failed to get YouTube stats' });
  }
};

exports.disconnectYouTube = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.youtube = undefined; // Remove YouTube data
    await user.save();

    res.json({ success: true, message: 'YouTube account disconnected successfully.' });
  } catch (err) {
    console.error('Error disconnecting YouTube account:', err);
    res.status(500).json({ error: 'Failed to disconnect YouTube account.' });
  }
};

exports.loginWithMobileNumber = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'Mobile number and password are required.' });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, mobileNumber: user.mobileNumber },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: 'Login successful', token });
  } catch (error) {
    console.error('Login with mobile number error:', error);
    res.status(500).json({ success: false, message: 'Server error during mobile number login.' });
  }
};

// --- GrandAdmin Registration and Login Logic ---

// Models
const baseUserSchema = {
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false, unique: true, sparse: true, index: { sparse: true } },
  name: { type: String, required: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  password: { type: String, required: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  role: { type: String, required: true, enum: ['USER', 'ADMIN', 'SUPERADMIN', 'GRANDADMIN'] }
};
const grandAdminSchema = new mongoose.Schema(baseUserSchema);
const GrandAdmin = mongoose.models.GrandAdmin || mongoose.model('GrandAdmin', grandAdminSchema, 'grandadmins');

// PendingVerification Schema
const pendingVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true }
});
const PendingVerification = mongoose.models.PendingVerification || mongoose.model('PendingVerification', pendingVerificationSchema);

// Email transporter setup (use your .env for credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/request-email-verification
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    // Check if email already exists
    const exists = await GrandAdmin.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await PendingVerification.findOneAndUpdate(
      { email },
      { token: verificationToken, expires: verificationExpires },
      { upsert: true, new: true }
    );
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://clean-dashboard-dun.vercel.app'}/complete-registration?email=${encodeURIComponent(email)}&token=${encodeURIComponent(verificationToken)}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Complete Your Registration',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Email Verification</h2>
        <p>Hello!</p>
        <p>Click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>`
    });
    res.json({ success: true, message: 'Verification email sent successfully! Please check your inbox.' });
  } catch (error) {
    console.error('Email verification request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/complete-registration
exports.completeRegistration = async (req, res) => {
  try {
    const { email, phone, name, role, password, token } = req.body;
    if (!email || !phone || !name || !role || !password || !token) {
      return res.status(400).json({ success: false, message: 'Email, phone, name, role, password, and token are required' });
    }
    // Validate pending verification
    const pending = await PendingVerification.findOne({ email, token, expires: { $gt: Date.now() } });
    if (!pending) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
    // Check if email or phone exists
    const existing = await User.findOne({ $or: [{ email }, { mobileNumber: phone }] });
    if (existing) return res.status(400).json({ success: false, message: 'A user with this email or phone already exists.' });
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new GrandAdmin
    const newUser = new GrandAdmin({
      email,
      phone,
      name,
      password: hashedPassword,
      role,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date()
    });
    await newUser.save();
    await PendingVerification.deleteOne({ email });
    // Generate JWT token
    const tokenJwt = jwt.sign(
      { userId: newUser._id, email: newUser.email, phone: newUser.phone, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      success: true,
      message: 'Registration completed successfully!',
      data: {
        token: tokenJwt,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role
        }
      }
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/login (Universal login for all user types)
exports.universalLogin = async (req, res) => {
  try {
    const { email, password, role, verificationCode } = req.body;
    console.log('🔍 Universal login attempt:', { email, role });
    
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password, and role' });
    }
    
    // Validate role
    if (!['USER', 'ADMIN', 'SUPERADMIN', 'GRANDADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }
    
    let user = null;
    
    // Check in appropriate collection based on role
    if (role === 'GRANDADMIN') {
      user = await GrandAdmin.findOne({ email });
    } else {
      user = await User.findOne({ email });
    }
    
    if (!user) {
      console.log('🔍 User not found for email:', email);
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    
    console.log('🔍 User found:', { id: user._id, email: user.email, role: user.role, hasPassword: !!user.password });
    
    // Check if user role matches the requested role
    if (user.role !== role) {
      console.log('🔍 Role mismatch:', { requested: role, actual: user.role });
      return res.status(400).json({ success: false, message: 'Invalid credentials for this role' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Password match result:', passwordMatch);
    if (!passwordMatch) {
      console.log('🔍 Invalid password for user:', email);
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }
    
    console.log('🔍 Login successful for user:', email);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        phone: user.mobileNumber || user.phone, 
        role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.mobileNumber || user.phone,
          role
        }
      }
    });
  } catch (error) {
    console.error('Universal login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GrandAdmin: Assign role (create user)
exports.assignRole = async (req, res) => {
  try {
    // Only GrandAdmin can create users
    if (!req.user || req.user.role !== 'GRANDADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied: Only GrandAdmin can create users.' });
    }
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['USER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Only USER, ADMIN, or SUPERADMIN allowed.' });
    }
    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { mobileNumber: phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email or phone already exists.' });
    }
    // Create user (password will be hashed by pre-save hook)
    const newUser = new User({
      name,
      email,
      mobileNumber: phone,
      password: password, // Will be hashed by pre-save hook
      role,
      createdAt: new Date(),
    });
    console.log('🔍 Creating new user:', { name, email, phone, role, hasPassword: !!password });
    await newUser.save();
    console.log('🔍 User created successfully:', { id: newUser._id, email: newUser.email, role: newUser.role });
    // Send credentials to user's email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Account Credentials',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to the Dashboard!</h2>
        <p>Hello <b>${name}</b>,</p>
        <p>Your account has been created by the Grand Admin. Here are your credentials:</p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Phone:</b> ${phone}</li>
          <li><b>Password:</b> ${password}</li>
          <li><b>Role:</b> ${role}</li>
        </ul>
        <p>Please log in and change your password after your first login.</p>
        <p>Best regards,<br/>Dashboard Team</p>
      </div>`
    });
    res.json({ success: true, message: 'User created and credentials sent to email.' });
  } catch (error) {
    console.error('GrandAdmin assignRole error:', error);
    res.status(500).json({ success: false, message: 'Server error: Could not create user.' });
  }
};

// GrandAdmin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'GRANDADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied: Only GrandAdmin can view all users.' });
    }
    const users = await User.find({}, '-password'); // Exclude password field
    res.json({ success: true, users });
  } catch (error) {
    console.error('GrandAdmin getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error: Could not fetch users.' });
  }
};

// GrandAdmin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'GRANDADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied: Only GrandAdmin can delete users.' });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('GrandAdmin deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Server error: Could not delete user.' });
  }
};

// GrandAdmin: Get all grandadmins
exports.getGrandAdmins = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'GRANDADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied: Only GrandAdmin can view all grandadmins.' });
    }
    const grandadmins = await GrandAdmin.find({}, '-password'); // Exclude password field
    res.json({ success: true, grandadmins });
  } catch (error) {
    console.error('GrandAdmin getGrandAdmins error:', error);
    res.status(500).json({ success: false, message: 'Server error: Could not fetch grandadmins.' });
  }
};