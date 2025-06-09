const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Skip auth for Google OAuth routes
  if (req.path === '/google' || req.path === '/google/callback') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  // Log auth attempt in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth attempt:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? 'Bearer [HIDDEN]' : 'none'
    });
  }

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
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: err.message === 'jwt expired' ? 'Token has expired' : 'Invalid token provided'
    });
  }
};