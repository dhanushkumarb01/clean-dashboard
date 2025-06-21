// Simple script to add test data directly to MongoDB without WhatsApp API calls
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function addTestDataDirectly() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB Atlas');

    // Import the models
    const WhatsAppMessage = require('./backend/models/WhatsAppMessage');
    const WhatsAppProfile = require('./backend/models/WhatsAppProfile');
    
    console.log('Adding sample WhatsApp messages...');
    
    // Sample contacts
    const contacts = [
      { phone: '+919876543210', name: 'John Doe' },
      { phone: '+919876543211', name: 'Jane Smith' },
      { phone: '+919876543212', name: 'Bob Johnson' },
      { phone: '+919876543213', name: 'Alice Williams' },
      { phone: '+919876543214', name: 'Charlie Brown' }
    ];
    
    const messages = [];
    const now = new Date();
    
    // Create 30 sample messages over the last 7 days
    for (let i = 0; i < 30; i++) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const isIncoming = Math.random() > 0.4; // 60% incoming, 40% outgoing
      const daysAgo = Math.floor(Math.random() * 7); // Last 7 days
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
      
      const message = new WhatsAppMessage({
        messageId: `direct_test_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        from: isIncoming ? contact.phone : process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
        to: isIncoming ? process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559' : contact.phone,
        message: `Test message ${i + 1}: ${isIncoming ? 'Hello from ' + contact.name : 'Response from business'}`,
        messageType: 'text',
        direction: isIncoming ? 'incoming' : 'outgoing',
        status: isIncoming ? 'read' : (Math.random() > 0.1 ? 'delivered' : 'sent'),
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
        wabaId: process.env.WHATSAPP_WABA_ID || 'test_waba_id',
        timestamp,
        contactName: contact.name,
        contactProfile: {
          name: contact.name,
          wa_id: contact.phone
        }
      });
      
      if (!isIncoming && message.status === 'delivered') {
        message.deliveredAt = new Date(timestamp.getTime() + Math.floor(Math.random() * 300000)); // Delivered within 5 minutes
      }
      
      messages.push(message);
    }
    
    // Clear existing test messages first
    await WhatsAppMessage.deleteMany({ messageId: { $regex: /^(test_|direct_test_)/ } });
    console.log('Cleared existing test messages');
    
    // Insert new messages
    await WhatsAppMessage.insertMany(messages);
    console.log(`Added ${messages.length} test messages`);
    
    // Create or update WhatsApp Business Profile
    await WhatsAppProfile.findOneAndUpdate(
      { wabaId: process.env.WHATSAPP_WABA_ID || 'test_waba_id' },
      {
        wabaId: process.env.WHATSAPP_WABA_ID || 'test_waba_id',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '725554853964559',
        businessProfile: {
          name: 'Dhanush Business Account',
          verifiedName: 'Dhanush Business Account',
          displayPhoneNumber: '+919876543200',
          about: 'Test WhatsApp Business Account for Dashboard'
        },
        analytics: {
          totalChats: contacts.length,
          totalContacts: contacts.length,
          deliveryRate: 95,
          responseRate: 88,
          averageResponseTime: 12
        },
        accountInfo: {
          status: 'CONNECTED',
          codeVerificationStatus: 'VERIFIED'
        },
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    console.log('Created/updated WhatsApp Business Profile');
    
    // Show final statistics
    const totalMessages = await WhatsAppMessage.countDocuments();
    const totalSent = await WhatsAppMessage.countDocuments({ direction: 'outgoing' });
    const totalReceived = await WhatsAppMessage.countDocuments({ direction: 'incoming' });
    const uniqueContacts = await WhatsAppMessage.distinct('from');
    
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const messages24h = await WhatsAppMessage.countDocuments({ timestamp: { $gte: last24Hours } });
    
    console.log('\n=== Database Statistics ===');
    console.log(`Total Messages: ${totalMessages}`);
    console.log(`Messages Sent: ${totalSent}`);
    console.log(`Messages Received: ${totalReceived}`);
    console.log(`Unique Contacts: ${uniqueContacts.length}`);
    console.log(`Messages (24h): ${messages24h}`);
    console.log(`Contacts: ${contacts.length}`);
    
    console.log('\n✅ Test data added successfully!');
    console.log('🔄 Now refresh your WhatsApp dashboard to see the data.');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
    if (error.name === 'MongoTimeoutError') {
      console.log('💡 This appears to be a MongoDB connection timeout.');
      console.log('   Please check if your MongoDB Atlas cluster is running and accessible.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

addTestDataDirectly();
