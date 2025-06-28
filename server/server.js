require('dotenv').config({ path: './config/server.env' });

// Log environment variables (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Variables:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Missing');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI ? '✓ Set' : '✗ Missing');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'https://clean-dashboard-dun.vercel.app');
  console.log('BACKEND_URL:', process.env.BACKEND_URL ? '✓ Set' : '✗ Missing', process.env.BACKEND_URL || '(Not set)');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('PORT:', process.env.PORT || 5000);
  console.log('-------------------');
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const youtubeRoutes = require('./routes/youtube');
const telegramRoutes = require('./routes/telegram');
const whatsappRoutes = require('./routes/whatsapp');
const usersRoutes = require('./routes/users');
const instagramRoutes = require('./routes/instagramRoutes');

const app = express();

app.set('trust proxy', 1); // Fix express-rate-limit X-Forwarded-For warning

const allowedOrigins = [
  'https://clean-dashboard-dun.vercel.app',
  'http://localhost:3000',
  'https://localhost:3000'
];
console.log('CORS allowed origins:', allowedOrigins);
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json()); // ✅ This line is now at the correct place
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// OAuth callback must be before auth middleware
app.get('/api/youtube/oauth2callback', require('./controllers/authController').googleCallback);

// ✅ Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/instagram', instagramRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'https://clean-dashboard-dun.vercel.app'}`);
});
