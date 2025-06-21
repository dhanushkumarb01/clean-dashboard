const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function addRealContactData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const WhatsAppMessage = require('./backend/models/WhatsAppMessage');
    
    // Clear any existing test data first
    await WhatsAppMessage.deleteMany({ 
      $or: [
        { messageId: { $regex: /^(test_|direct_test_)/ } },
        { from: { $regex: /^\+91987654/ } } // Remove fake test numbers
      ]
    });
    console.log('Cleared existing test data');
    
    const messages = [];
    const now = new Date();
    const yourNumber = '+919000283611';
    const businessNumber = process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559';
    
    // Add some realistic conversation messages
    const conversationData = [
      { message: 'Hello! I would like to know more about your services', isIncoming: true, daysAgo: 2, hoursAgo: 14 },
      { message: 'Hi! Thank you for contacting us. How can we help you today?', isIncoming: false, daysAgo: 2, hoursAgo: 13 },
      { message: 'I am interested in your WhatsApp dashboard solution', isIncoming: true, daysAgo: 2, hoursAgo: 12 },
      { message: 'Great! Our WhatsApp dashboard provides real-time analytics and message management. Would you like a demo?', isIncoming: false, daysAgo: 2, hoursAgo: 11 },
      { message: 'Yes, that would be perfect!', isIncoming: true, daysAgo: 2, hoursAgo: 10 },
      { message: 'Excellent! I\'ll set up a demo for you. What time works best?', isIncoming: false, daysAgo: 2, hoursAgo: 9 },
      { message: 'Tomorrow afternoon would be ideal', isIncoming: true, daysAgo: 1, hoursAgo: 16 },
      { message: 'Perfect! I\'ve scheduled a demo for tomorrow at 2 PM. Looking forward to showing you our features!', isIncoming: false, daysAgo: 1, hoursAgo: 15 },
      { message: 'Thank you! See you tomorrow', isIncoming: true, daysAgo: 1, hoursAgo: 14 },
      { message: 'Hello! This is a reminder about our demo today at 2 PM', isIncoming: false, daysAgo: 0, hoursAgo: 4 },
      { message: 'Thanks for the reminder! I\'ll be ready', isIncoming: true, daysAgo: 0, hoursAgo: 3 },
      { message: 'Great! The demo was successful. Here\'s the link to get started: https://dashboard.example.com', isIncoming: false, daysAgo: 0, hoursAgo: 1 }
    ];
    
    // Create messages with realistic timestamps
    conversationData.forEach((msgData, index) => {
      const timestamp = new Date(
        now.getTime() - 
        (msgData.daysAgo * 24 * 60 * 60 * 1000) - 
        (msgData.hoursAgo * 60 * 60 * 1000) - 
        (index * 2 * 60 * 1000) // 2 minutes apart for ordering
      );
      
      const message = new WhatsAppMessage({
        messageId: `real_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        from: msgData.isIncoming ? yourNumber : businessNumber,
        to: msgData.isIncoming ? businessNumber : yourNumber,
        message: msgData.message,
        messageType: 'text',
        direction: msgData.isIncoming ? 'incoming' : 'outgoing',
        status: msgData.isIncoming ? 'read' : 'delivered',
        phoneNumberId: businessNumber,
        wabaId: process.env.WHATSAPP_WABA_ID || '23866483372961617',
        timestamp,
        contactName: msgData.isIncoming ? 'Dhanush Kumar' : 'Business Support',
        contactProfile: {
          name: msgData.isIncoming ? 'Dhanush Kumar' : 'Business Support',
          wa_id: msgData.isIncoming ? yourNumber : businessNumber
        }
      });
      
      if (!msgData.isIncoming && message.status === 'delivered') {
        message.deliveredAt = new Date(timestamp.getTime() + Math.floor(Math.random() * 120000)); // Delivered within 2 minutes
      }
      
      messages.push(message);
    });
    
    // Insert the real conversation
    await WhatsAppMessage.insertMany(messages);
    console.log(`Added ${messages.length} realistic conversation messages`);
    
    // Show final statistics
    const totalMessages = await WhatsAppMessage.countDocuments();
    const totalSent = await WhatsAppMessage.countDocuments({ direction: 'outgoing' });
    const totalReceived = await WhatsAppMessage.countDocuments({ direction: 'incoming' });
    const messagesWithYourNumber = await WhatsAppMessage.countDocuments({
      $or: [{ from: yourNumber }, { to: yourNumber }]
    });
    
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const messages24h = await WhatsAppMessage.countDocuments({ timestamp: { $gte: last24Hours } });
    
    console.log('\n=== Real Contact Data Statistics ===');
    console.log(`Total Messages: ${totalMessages}`);
    console.log(`Messages Sent: ${totalSent}`);
    console.log(`Messages Received: ${totalReceived}`);
    console.log(`Messages with ${yourNumber}: ${messagesWithYourNumber}`);
    console.log(`Messages (24h): ${messages24h}`);
    console.log(`Unique Contacts: 1 (${yourNumber})`);
    
    console.log('\n✅ Real contact data added successfully!');
    console.log(`🔄 Now refresh your WhatsApp dashboard to see data with ${yourNumber}`);
    
  } catch (error) {
    console.error('❌ Error adding real contact data:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

addRealContactData();
