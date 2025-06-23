const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
  },
  commentId: {
    type: String,
    required: true,
    unique: true, // Ensure comments are not duplicated
  },
  authorDisplayName: {
    type: String,
    required: true,
  },
  authorChannelId: {
    type: String, // Unique identifier for the author's channel
    required: true,
  },
  publishedAt: {
    type: Date,
    required: true,
  },
  textDisplay: {
    type: String,
  },
  channelId: { // The YouTube channel ID to which the video (and thus comment) belongs
    type: String,
    required: true,
  },
  userId: { // Reference to our internal User model, for multi-user support
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // --- Classification fields for fraud/threat/safety analysis ---
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { type: String }, // User ID who flagged
  flaggedAt: { type: Date },
  suspiciousKeywords: [{ type: String }], // Array of detected suspicious keywords
  riskScore: { type: Number, default: 0, min: 0, max: 10 }, // Risk assessment score
  label: { type: String, enum: ['safe', 'fraud', 'sensitive', 'spam', 'other'], default: 'safe' },
  isSafe: { type: Boolean, default: true },
  isFraud: { type: Boolean, default: false },
  isSensitive: { type: Boolean, default: false },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Add an index for efficient querying by author or channel
CommentSchema.index({ authorChannelId: 1, channelId: 1 });

module.exports = mongoose.model('Comment', CommentSchema); 