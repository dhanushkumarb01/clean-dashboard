const WhatsAppMessage = require('./backend/models/WhatsAppMessage');
const { updateWhatsAppProfileStats } = require('./backend/controllers/whatsappController');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB
const mongoose = require('mongoose');

async function testIncomingMessages() {
  try {
    console.log('\n📥 === TESTING INCOMING MESSAGES FLOW ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get current stats
    const initialStats = {
      totalMessages: await WhatsAppMessage.countDocuments(),
      totalSent: await WhatsAppMessage.countDocuments({ direction: 'outgoing' }),
      totalReceived: await WhatsAppMessage.countDocuments({ direction: 'incoming' }),
      uniqueContacts: (await WhatsAppMessage.distinct('from')).length
    };
    
    console.log('📊 Initial Stats:', initialStats);
    
    // Test phone number (the number that will "send" you messages)
    const testPhoneNumber = '+919876543210';
    const businessPhoneNumber = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    console.log('\n📱 Test Configuration:');
    console.log('Test Phone Number (sender):', testPhoneNumber);
    console.log('Business Phone Number (receiver):', businessPhoneNumber);
    
    // Create test incoming messages
    const testMessages = [
      {
        messageId: `incoming_test_${Date.now()}_1`,
        from: testPhoneNumber,
        to: businessPhoneNumber,
        message: 'Hello! This is a test message TO your business number.',
        messageType: 'text',
        direction: 'incoming',
        status: 'read',
        phoneNumberId: businessPhoneNumber,
        wabaId: process.env.WHATSAPP_WABA_ID,
        timestamp: new Date(),
        contactName: 'Test User',
        webhookData: {
          message: {
            id: `incoming_test_${Date.now()}_1`,
            from: testPhoneNumber,
            text: { body: 'Hello! This is a test message TO your business number.' },
            type: 'text',
            timestamp: Math.floor(Date.now() / 1000).toString()
          },
          contact: {
            profile: { name: 'Test User' }
          },
          metadata: {
            phone_number_id: businessPhoneNumber
          }
        }
      },
      {
        messageId: `incoming_test_${Date.now()}_2`,
        from: testPhoneNumber,
        to: businessPhoneNumber,
        message: 'Can you please help me with my order?',
        messageType: 'text',
        direction: 'incoming',
        status: 'read',
        phoneNumberId: businessPhoneNumber,
        wabaId: process.env.WHATSAPP_WABA_ID,
        timestamp: new Date(Date.now() - 30000), // 30 seconds ago
        contactName: 'Test User',
        webhookData: {
          message: {
            id: `incoming_test_${Date.now()}_2`,
            from: testPhoneNumber,
            text: { body: 'Can you please help me with my order?' },
            type: 'text',
            timestamp: Math.floor((Date.now() - 30000) / 1000).toString()
          },
          contact: {
            profile: { name: 'Test User' }
          },
          metadata: {
            phone_number_id: businessPhoneNumber
          }
        }
      },
      {
        messageId: `incoming_test_${Date.now()}_3`,
        from: '+919876543211',
        to: businessPhoneNumber,
        message: 'Hi, I am interested in your services.',
        messageType: 'text',
        direction: 'incoming',
        status: 'read',
        phoneNumberId: businessPhoneNumber,
        wabaId: process.env.WHATSAPP_WABA_ID,
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        contactName: 'Jane Smith',
        webhookData: {
          message: {
            id: `incoming_test_${Date.now()}_3`,
            from: '+919876543211',
            text: { body: 'Hi, I am interested in your services.' },
            type: 'text',
            timestamp: Math.floor((Date.now() - 60000) / 1000).toString()
          },
          contact: {
            profile: { name: 'Jane Smith' }
          },
          metadata: {
            phone_number_id: businessPhoneNumber
          }
        }
      }
    ];
    
    console.log('\n💾 Creating test incoming messages...');
    
    // Save messages to database
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      const whatsappMessage = new WhatsAppMessage(message);
      await whatsappMessage.save();
      console.log(`✅ Saved incoming message ${i + 1}: "${message.message.substring(0, 30)}..."`);
    }
    
    // Update stats
    console.log('\n📊 Updating WhatsApp profile stats...');
    await updateWhatsAppProfileStats();
    
    // Get updated stats
    const finalStats = {
      totalMessages: await WhatsAppMessage.countDocuments(),
      totalSent: await WhatsAppMessage.countDocuments({ direction: 'outgoing' }),
      totalReceived: await WhatsAppMessage.countDocuments({ direction: 'incoming' }),
      uniqueContacts: (await WhatsAppMessage.distinct('from')).length
    };
    
    console.log('\n📈 Final Stats:', finalStats);
    console.log('\n📊 Changes:');
    console.log(`   • Total Messages: ${initialStats.totalMessages} → ${finalStats.totalMessages} (+${finalStats.totalMessages - initialStats.totalMessages})`);
    console.log(`   • Messages Received: ${initialStats.totalReceived} → ${finalStats.totalReceived} (+${finalStats.totalReceived - initialStats.totalReceived})`);
    console.log(`   • Unique Contacts: ${initialStats.uniqueContacts} → ${finalStats.uniqueContacts} (+${finalStats.uniqueContacts - initialStats.uniqueContacts})`);
    
    // Get recent messages to verify
    console.log('\n📋 Recent Messages in Database:');
    const recentMessages = await WhatsAppMessage.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .select('from to message direction timestamp status contactName');
    
    recentMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.direction.toUpperCase()}] ${msg.contactName || msg.from}: "${msg.message.substring(0, 40)}..."`);
      console.log(`      From: ${msg.from} → To: ${msg.to} | Status: ${msg.status}`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Open your React dashboard: http://localhost:3000/whatsapp');
    console.log('2. Check the following sections:');
    console.log('   • Stats cards should show updated numbers');
    console.log('   • Recent Messages section should show the new messages');
    console.log('   • Contacts section should show the test contacts');
    console.log('3. Look for:');
    console.log(`   • Test User (${testPhoneNumber})`);
    console.log(`   • Jane Smith (+919876543211)`);
    
    console.log('\n✅ Test incoming messages created successfully!');
    console.log('Check your React dashboard to see the results.');
    
  } catch (error) {
    console.error('❌ Error testing incoming messages:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testIncomingMessages();
