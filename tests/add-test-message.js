const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function addTestMessage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Import the model after connection
    const WhatsAppMessage = require('./backend/models/WhatsAppMessage');
    
    // Create a test message
    const testMessage = new WhatsAppMessage({
      messageId: `test_msg_${Date.now()}`,
      from: '+919876543210',
      to: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
      message: 'Test message from script',
      messageType: 'text',
      direction: 'incoming',
      status: 'read', // For incoming messages, use 'read' status
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
      wabaId: process.env.WHATSAPP_WABA_ID || 'test_waba_id',
      timestamp: new Date(),
      contactName: 'Test Contact'
    });

    await testMessage.save();
    console.log('✅ Test message saved successfully!');
    
    // Check total messages
    const totalMessages = await WhatsAppMessage.countDocuments();
    console.log(`Total messages in database: ${totalMessages}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

addTestMessage();
