const mongoose = require('mongoose');

const telegramMessageSchema = new mongoose.Schema({
  // Message identifiers
  messageId: { type: String, required: true },
  chatId: { type: String, required: true },
  chatName: { type: String, required: true },
  chatType: { type: String, enum: ['group', 'channel', 'private'], required: true },
  
  // Sender information
  senderId: { type: String, required: true },
  senderUsername: { type: String },
  senderFirstName: { type: String },
  senderLastName: { type: String },
  senderIsBot: { type: Boolean, default: false },
  
  // Message content
  messageText: { type: String },
  messageType: { type: String, enum: ['text', 'photo', 'video', 'document', 'audio', 'sticker', 'voice', 'animation', 'contact', 'location', 'other'], default: 'text' },
  hasMedia: { type: Boolean, default: false },
  mediaType: { type: String },
  
  // Timestamps
  timestamp: { type: Date, required: true },
  editedTimestamp: { type: Date },
  
  // Engagement metrics
  views: { type: Number, default: 0 },
  forwards: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  
  // Content analysis
  wordCount: { type: Number, default: 0 },
  containsUrls: { type: Boolean, default: false },
  containsHashtags: { type: Boolean, default: false },
  containsMentions: { type: Boolean, default: false },
  language: { type: String },
  
  // Moderation flags
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { type: String }, // User ID who flagged
  flaggedAt: { type: Date },
  suspiciousKeywords: [{ type: String }], // Array of detected suspicious keywords
  riskScore: { type: Number, default: 0, min: 0, max: 10 }, // Risk assessment score
  
  // Metadata
  collectionBatch: { type: String }, // To track which collection run this came from
  dataSource: { type: String, default: 'telethon' },
  isDeleted: { type: Boolean, default: false },
  
  // New fields
  phone: { type: String, required: true, index: true },
}, {
  timestamps: true
});

// Indexes for efficient queries
telegramMessageSchema.index({ chatId: 1, timestamp: -1 });
telegramMessageSchema.index({ senderId: 1, timestamp: -1 });
telegramMessageSchema.index({ timestamp: -1 });
telegramMessageSchema.index({ isFlagged: 1 });
telegramMessageSchema.index({ riskScore: -1 });
telegramMessageSchema.index({ collectionBatch: 1 });

// Compound indexes for common query patterns
telegramMessageSchema.index({ chatId: 1, isFlagged: 1 });
telegramMessageSchema.index({ senderId: 1, isFlagged: 1 });

module.exports = mongoose.model('TelegramMessage', telegramMessageSchema);
