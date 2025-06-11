const mongoose = require('mongoose');

const whatsappMessageSchema = new mongoose.Schema({
  // Message identification
  messageId: { type: String, required: true, unique: true },
  
  // Sender/Receiver information
  from: { type: String, required: true }, // Phone number or WhatsApp ID
  to: { type: String, required: true }, // Phone number or WhatsApp ID
  
  // Message content
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'document', 'audio', 'video', 'template'], default: 'text' },
  
  // Direction: incoming (received) or outgoing (sent)
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  
  // WhatsApp API response data
  status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
  
  // Timestamps
  timestamp: { type: Date, default: Date.now },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  
  // Metadata
  phoneNumberId: { type: String, required: true }, // WhatsApp Business Phone Number ID
  wabaId: { type: String }, // WhatsApp Business Account ID
  
  // Error handling
  error: {
    code: { type: Number },
    message: { type: String },
    details: { type: String }
  },
  
  // Additional data from webhook
  webhookData: { type: mongoose.Schema.Types.Mixed },
  
  // Contact information (if available)
  contactName: { type: String },
  contactProfile: {
    name: { type: String },
    wa_id: { type: String }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
whatsappMessageSchema.index({ from: 1, timestamp: -1 });
whatsappMessageSchema.index({ to: 1, timestamp: -1 });
whatsappMessageSchema.index({ direction: 1, timestamp: -1 });
whatsappMessageSchema.index({ phoneNumberId: 1, timestamp: -1 });
whatsappMessageSchema.index({ status: 1 });
whatsappMessageSchema.index({ timestamp: -1 });

module.exports = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
