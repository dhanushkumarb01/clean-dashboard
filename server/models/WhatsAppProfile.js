const mongoose = require('mongoose');

const whatsappProfileSchema = new mongoose.Schema({
  // WhatsApp Business Account Information
  wabaId: { type: String, required: true, unique: true },
  phoneNumberId: { type: String, required: true },
  
  // Business Profile Data
  businessProfile: {
    name: { type: String },
    about: { type: String },
    address: { type: String },
    description: { type: String },
    email: { type: String },
    websites: [{ type: String }],
    profilePictureUrl: { type: String },
    verifiedName: { type: String },
    displayPhoneNumber: { type: String },
    qualityRating: { type: String },
    platformType: { type: String },
    throughputLevel: { type: String }
  },
  
  // Account Statistics
  accountInfo: {
    accountType: { type: String },
    country: { type: String },
    countryCode: { type: String },
    namingStatus: { type: String },
    qualityRating: { type: String },
    status: { type: String },
    codeVerificationStatus: { type: String }
  },
  
  // Messaging Statistics
  messagingLimits: {
    dailyConversationsCap: { type: Number },
    maxDailyConversationPerContact: { type: Number },
    maxPhoneNumbersPerBusiness: { type: Number },
    maxPhoneNumbersPerWaba: { type: Number }
  },
  
  // Analytics Data
  analytics: {
    totalChats: { type: Number, default: 0 },
    totalContacts: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    deliveryRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 } // in minutes
  },
  
  // API Status
  apiStatus: {
    connected: { type: Boolean, default: false },
    lastSync: { type: Date },
    tokenExpiry: { type: Date },
    webhookConfigured: { type: Boolean, default: false }
  },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes (wabaId index is already created by unique: true)
whatsappProfileSchema.index({ phoneNumberId: 1 });
whatsappProfileSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('WhatsAppProfile', whatsappProfileSchema);
