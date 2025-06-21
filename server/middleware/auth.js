const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
    req.user = { id: 'test-user', email: 'test@example.com' }; // Mock user
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
