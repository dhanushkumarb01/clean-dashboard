const mongoose = require('mongoose');

const InstagramMediaSchema = new mongoose.Schema({
  media_id: { type: String, required: true, unique: true },
  instagram_account_id: String,
  media_type: String,
  media_url: String,
  thumbnail_url: String,
  caption: String,
  permalink: String,
  timestamp: Date,
  like_count: Number,
  comments_count: Number,
  owner: mongoose.Schema.Types.Mixed,
  insights: mongoose.Schema.Types.Mixed,
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InstagramMedia', InstagramMediaSchema); 