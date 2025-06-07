const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  title: String,
  description: String,
  publishedAt: Date,
  thumbnails: Object,
  stats: Object,
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema); 