const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// GrandAdmin model (defined in controller, but we need it here)
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

module.exports = async (req, res, next) => {
  // Skip auth for Google OAuth routes first
  if (req.path === '/google' || req.path === '/google/callback') {
    return next();
  }

  // Skip auth completely in development for debugging (ALWAYS bypass)
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 DEVELOPMENT: Bypassing authentication for debugging', {
      path: req.path,
      method: req.method,
      hasToken: !!req.headers.authorization
    });
    req.user = { id: 'test-user', email: 'test@example.com', role: 'GRANDADMIN' }; // Mock as GrandAdmin for dev
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No authorization header provided'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Invalid authorization format',
      message: 'Authorization header must start with Bearer'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Try User collection first
    let user = await User.findById(decoded.userId || decoded.id);
    if (!user) {
      // Try GrandAdmin collection
      user = await GrandAdmin.findById(decoded.userId || decoded.id);
    }
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'No user found for this token.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: err.message === 'jwt expired' ? 'Token has expired' : 'Invalid token provided'
    });
  }
};
