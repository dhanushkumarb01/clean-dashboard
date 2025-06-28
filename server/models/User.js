const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  mobileNumber: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: String,
  picture: String,
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPERADMIN'], default: 'USER' },
  youtube: {
    google_email: String,
    access_token: String,
    refresh_token: String,
    channel_id: String,
    channel_title: String,
    profile_picture: String,
    connected_at: Date,
    last_stats_update: Date,
    stats: {
      viewCount: Number,
      subscriberCount: Number,
      videoCount: Number,
      commentCount: Number,
      uniqueAuthors: Number,
      lastUpdated: Date
    },
    quota_used: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Hash the password before saving (for mobile number login)
UserSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.lastLogin = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);
