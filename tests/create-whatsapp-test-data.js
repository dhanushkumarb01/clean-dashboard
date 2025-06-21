const mongoose = require('mongoose');
const WhatsAppMessage = require('./backend/models/WhatsAppMessage');
const WhatsAppProfile = require('./backend/models/WhatsAppProfile');
require('dotenv').config({ path: './backend/.env' });

// Sample phone numbers and contacts
const contacts = [
  { phone: '+919876543210', name: 'John Doe' },
  { phone: '+919876543211', name: 'Jane Smith' },
  { phone: '+919876543212', name: 'Bob Johnson' },
  { phone: '+919876543213', name: 'Alice Williams' },
  { phone: '+919876543214', name: 'Charlie Brown' },
  { phone: '+919876543215', name: 'Diana Prince' },
  { phone: '+919876543216', name: 'Frank Miller' },
  { phone: '+919876543217', name: 'Grace Lee' }
];

// Sample messages
const messageTemplates = [
  'Hello, how are you?',
  'Good morning!',
  'Thank you for your message',
  'Can you please help me with this?',
  'I have a question about your service',
  'Thanks for the quick response!',
  'Looking forward to hearing from you',
  'Have a great day!',
  'Could you send me more details?',
  'Perfect, that works for me',
  'I\'ll get back to you soon',
  'Thanks for the information',
  'Is this available now?',
  'Great, let\'s proceed',
  'I need some clarification',
  'Sounds good to me',
  'When can we schedule this?',
  'I appreciate your help',
  'This is exactly what I needed',
  'Thank you so much!'
];

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1234567890';
const WABA_ID = process.env.WHATSAPP_WABA_ID || 'test_waba_id';

async function createTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');

    // Check existing data
    const existingMessages = await WhatsAppMessage.countDocuments();
    console.log(`Found ${existingMessages} existing WhatsApp messages`);
    
    if (existingMessages > 0) {
      console.log('WhatsApp test data already exists. Skipping creation.');
      return;
    }

    // Create sample messages
    console.log('Creating sample WhatsApp messages...');
    const messages = [];
    const now = new Date();
    
    // Generate messages over the last 30 days
    for (let i = 0; i < 150; i++) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const messageText = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      const isIncoming = Math.random() > 0.4; // 60% incoming, 40% outgoing
      
      // Random timestamp within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
      
      const messageId = `msg_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message = new WhatsAppMessage({
        messageId,
        from: isIncoming ? contact.phone : PHONE_NUMBER_ID,
        to: isIncoming ? PHONE_NUMBER_ID : contact.phone,
        message: messageText,
        messageType: 'text',
        direction: isIncoming ? 'incoming' : 'outgoing',
        status: isIncoming ? 'received' : (Math.random() > 0.1 ? 'delivered' : 'sent'),
        phoneNumberId: PHONE_NUMBER_ID,
        wabaId: WABA_ID,
        timestamp,
        contactName: contact.name,
        contactProfile: {
          name: contact.name,
          wa_id: contact.phone
        }
      });

      if (!isIncoming) {
        message.sentAt = timestamp;
        if (message.status === 'delivered') {
          message.deliveredAt = new Date(timestamp.getTime() + Math.floor(Math.random() * 300000)); // Delivered within 5 minutes
        }
      }

      messages.push(message);
    }

    // Insert all messages
    await WhatsAppMessage.insertMany(messages);
    console.log(`Created ${messages.length} sample WhatsApp messages`);

    // Create a sample WhatsApp Business Profile
    console.log('Creating sample WhatsApp Business Profile...');
    const profile = new WhatsAppProfile({
      wabaId: WABA_ID,
      businessProfile: {
        name: 'Dhanush Business Account',
        verifiedName: 'Dhanush Business Account',
        displayPhoneNumber: '+919876543200',
        about: 'Your trusted business partner for all communication needs'
      },
      analytics: {
        totalChats: contacts.length,
        totalContacts: contacts.length,
        totalMessages: messages.length,
        messagesSent: messages.filter(m => m.direction === 'outgoing').length,
        messagesReceived: messages.filter(m => m.direction === 'incoming').length,
        deliveryRate: 95,
        responseRate: 88,
        averageResponseTime: 12
      },
      accountInfo: {
        status: 'CONNECTED',
        qualityRating: 'HIGH',
        codeVerificationStatus: 'VERIFIED'
      },
      lastUpdated: new Date()
    });

    await profile.save();
    console.log('Created sample WhatsApp Business Profile');

    // Generate some statistics
    const totalMessages = await WhatsAppMessage.countDocuments();
    const totalSent = await WhatsAppMessage.countDocuments({ direction: 'outgoing' });
    const totalReceived = await WhatsAppMessage.countDocuments({ direction: 'incoming' });
    const uniqueContacts = await WhatsAppMessage.distinct('from');
    
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const messages24h = await WhatsAppMessage.countDocuments({ timestamp: { $gte: last24Hours } });
    const messages7d = await WhatsAppMessage.countDocuments({ timestamp: { $gte: last7Days } });

    console.log('\n=== WhatsApp Test Data Summary ===');
    console.log(`Total Messages: ${totalMessages}`);
    console.log(`Messages Sent: ${totalSent}`);
    console.log(`Messages Received: ${totalReceived}`);
    console.log(`Unique Contacts: ${uniqueContacts.length}`);
    console.log(`Messages (24h): ${messages24h}`);
    console.log(`Messages (7d): ${messages7d}`);
    console.log(`Contacts Created: ${contacts.length}`);

    console.log('\n✅ WhatsApp test data created successfully!');
    console.log('You can now refresh your WhatsApp dashboard to see real-time data from MongoDB Atlas.');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createTestData().catch(console.error);
}

module.exports = createTestData;
