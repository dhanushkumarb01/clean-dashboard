const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  name: String,
  picture: String,
  youtube: {
    google_email: String,
    access_token: String,
    refresh_token: String,
    channel_id: String,
    connected_at: Date,
    last_stats_update: Date,
    stats: {
      viewCount: Number,
      subscriberCount: Number,
      videoCount: Number
    },
    quota_used: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Update lastLogin timestamp on every save
UserSchema.pre('save', function(next) {
  this.lastLogin = new Date();
  next();
});

module.exports = mongoose.model('User', UserSchema);
