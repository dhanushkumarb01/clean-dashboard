const mongoose = require('mongoose');

const InstagramUserSchema = new mongoose.Schema({
  instagram_id: { type: String, required: true, unique: true },
  username: String,
  account_type: String,
  followers_count: Number,
  follows_count: Number,
  media_count: Number,
  biography: String,
  website: String,
  profile_picture_url: String,
  last_updated: { type: Date, default: Date.now },
  access_token: String // Store encrypted in production
});

module.exports = mongoose.model('InstagramUser', InstagramUserSchema); 