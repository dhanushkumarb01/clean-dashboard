const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  title: String,
  description: String,
  publishedAt: Date,
  thumbnails: Object,
  stats: Object,
  owner: { type: String, required: true }, // Google user ID
}, { timestamps: true });

module.exports = mongoose.model('Channel', ChannelSchema); 