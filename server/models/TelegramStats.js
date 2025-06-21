const mongoose = require('mongoose');

const telegramStatsSchema = new mongoose.Schema({
  // Basic stats
  totalGroups: { type: Number, default: 0 },
  activeUsers: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  totalMediaFiles: { type: Number, default: 0 },
  
  // Rate metrics
  messageRate: { type: Number, default: 0 },
  rateChange: { type: Number, default: 0 },
  
  // Engagement metrics
  groupPropagation: { type: Number, default: 0 }, // Percentage
  avgViewsPerMessage: { type: Number, default: 0 },
  
  // Most active users
  mostActiveUsers: [{
    userId: { type: String, required: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    messageCount: { type: Number, default: 0 },
    telegramId: { type: String }
  }],
  
  // Most active groups and channels
  mostActiveGroups: [{
    groupId: { type: String, required: true },
    title: { type: String },
    username: { type: String },
    messageCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    isChannel: { type: Boolean, default: false }
  }],
  
  // Top users by groups joined
  topUsersByGroups: [{
    userId: { type: String, required: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    groupsJoined: { type: Number, default: 0 },
    telegramId: { type: String }
  }],
  
  // ** NEW: Law Enforcement Analytics Fields **
  
  // Enhanced Summary Metrics
  mostActiveUserLast7Days: {
    userId: { type: String },
    username: { type: String },
    messageCount: { type: Number, default: 0 }
  },
  avgMessagesPerDay: { type: Number, default: 0 },
  peakHourOfActivity: { type: Number, default: 0 }, // 0-23 hour format
  messageGrowthLast7Days: { type: Number, default: 0 }, // percentage
  totalSuspiciousUsers: { type: Number, default: 0 },
  
  // Suspicious Users with Scam Keywords
  suspiciousUsers: [{
    userId: { type: String, required: true },
    username: { type: String },
    firstName: { type: String },
    messageCount: { type: Number, default: 0 },
    keywordsMatched: [{ type: String }], // Array of matched suspicious keywords
    lastActive: { type: Date },
    groupsActive: [{ type: String }], // Group names/IDs they're active in
    riskScore: { type: Number, default: 0 } // 1-10 risk level
  }],
  
  // Location Intelligence (optional - will be null if not available)
  topUserLocations: [{
    locationName: { type: String },
    userCount: { type: Number, default: 0 },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }],
  
  // High-Risk Keywords Analysis
  keywordCloud: [{
    keyword: { type: String },
    frequency: { type: Number, default: 0 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  }],
  
  // Metadata
  timestamp: { type: Date, default: Date.now },
  dataSource: { type: String, default: 'telethon' },
  collectionPeriod: {
    start: { type: Date },
    end: { type: Date }
  }
}, {
  timestamps: true
});

// Index for efficient queries
telegramStatsSchema.index({ timestamp: -1 });

module.exports = mongoose.model('TelegramStats', telegramStatsSchema);
