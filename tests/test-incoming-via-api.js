const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testIncomingMessagesViaAPI() {
  try {
    console.log('\n📥 === TESTING INCOMING MESSAGES VIA API ===\n');
    
    const baseUrl = 'http://localhost:5000/api/whatsapp';
    
    // First check if server is running
    console.log('🔍 Checking if server is running...');
    try {
      await axios.get(`http://localhost:5000/api/whatsapp/ping-db`);
      console.log('✅ Server is running');
    } catch (error) {
      console.error('❌ Server is not running or not accessible');
      console.log('💡 Please start your server first:');
      console.log('   cd backend');
      console.log('   npm start');
      return;
    }
    
    // Get initial stats
    console.log('\n📊 Getting initial stats...');
    let initialStats;
    try {
      const statsResponse = await axios.get(`${baseUrl}/stats`, {
        headers: { Authorization: 'Bearer dummy-token' } // You may need to adjust this based on your auth
      });
      initialStats = statsResponse.data.data;
      console.log('Initial stats:', {
        totalMessages: initialStats.totalMessages,
        totalSent: initialStats.totalSent,
        totalReceived: initialStats.totalReceived,
        uniqueContacts: initialStats.uniqueContacts
      });
    } catch (error) {
      console.log('⚠️ Could not get initial stats (auth may be required)');
      initialStats = { totalMessages: 0, totalSent: 0, totalReceived: 0, uniqueContacts: 0 };
    }
    
    // Simulate webhook calls for incoming messages
    console.log('\n📨 Simulating incoming webhook messages...');
    
    const webhookUrl = 'http://localhost:5000/api/whatsapp/webhook';
    const testPhoneNumber = '+919876543210';
    const businessPhoneNumber = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    const incomingMessages = [
      {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID,
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: businessPhoneNumber
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'Test User'
                      },
                      wa_id: testPhoneNumber
                    }
                  ],
                  messages: [
                    {
                      from: testPhoneNumber,
                      id: `incoming_webhook_${Date.now()}_1`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Hello! This is a test message sent TO your WhatsApp Business number via webhook.'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      },
      {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID,
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: businessPhoneNumber
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'Test User'
                      },
                      wa_id: testPhoneNumber
                    }
                  ],
                  messages: [
                    {
                      from: testPhoneNumber,
                      id: `incoming_webhook_${Date.now()}_2`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Can you help me with my order? I need assistance.'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      },
      {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: process.env.WHATSAPP_WABA_ID,
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: businessPhoneNumber
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'Jane Smith'
                      },
                      wa_id: '+919876543211'
                    }
                  ],
                  messages: [
                    {
                      from: '+919876543211',
                      id: `incoming_webhook_${Date.now()}_3`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Hi, I am interested in your services. Please contact me.'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      }
    ];
    
    // Send webhook messages
    for (let i = 0; i < incomingMessages.length; i++) {
      const message = incomingMessages[i];
      const messageText = message.entry[0].changes[0].value.messages[0].text.body;
      const senderName = message.entry[0].changes[0].value.contacts[0].profile.name;
      
      console.log(`📤 Sending webhook ${i + 1}: "${messageText.substring(0, 40)}..." from ${senderName}`);
      
      try {
        const response = await axios.post(webhookUrl, message, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 200) {
          console.log(`✅ Webhook ${i + 1} sent successfully`);
        } else {
          console.log(`⚠️ Webhook ${i + 1} response: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Webhook ${i + 1} failed:`, error.message);
      }
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n⏳ Waiting 3 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get updated stats
    console.log('\n📊 Getting updated stats...');
    try {
      const statsResponse = await axios.get(`${baseUrl}/stats`, {
        headers: { Authorization: 'Bearer dummy-token' }
      });
      const finalStats = statsResponse.data.data;
      
      console.log('Final stats:', {
        totalMessages: finalStats.totalMessages,
        totalSent: finalStats.totalSent,
        totalReceived: finalStats.totalReceived,
        uniqueContacts: finalStats.uniqueContacts
      });
      
      console.log('\n📊 Changes:');
      console.log(`   • Total Messages: ${initialStats.totalMessages} → ${finalStats.totalMessages} (+${finalStats.totalMessages - initialStats.totalMessages})`);
      console.log(`   • Messages Received: ${initialStats.totalReceived} → ${finalStats.totalReceived} (+${finalStats.totalReceived - initialStats.totalReceived})`);
      console.log(`   • Unique Contacts: ${initialStats.uniqueContacts} → ${finalStats.uniqueContacts} (+${finalStats.uniqueContacts - initialStats.uniqueContacts})`);
      
      // Show recent messages
      if (finalStats.recentMessages && finalStats.recentMessages.length > 0) {
        console.log('\n📋 Recent Messages:');
        finalStats.recentMessages.slice(0, 5).forEach((msg, index) => {
          console.log(`   ${index + 1}. [${msg.direction.toUpperCase()}] ${msg.contactName || msg.from}: "${msg.message.substring(0, 40)}..."`);
        });
      }
      
    } catch (error) {
      console.log('⚠️ Could not get updated stats (auth may be required)');
    }
    
    console.log('\n🎯 WHAT TO CHECK NOW:');
    console.log('1. Open your React dashboard: http://localhost:3000/whatsapp');
    console.log('2. Look for these test contacts in the dashboard:');
    console.log(`   • Test User (${testPhoneNumber})`);
    console.log(`   • Jane Smith (+919876543211)`);
    console.log('3. Check these sections:');
    console.log('   • Stats cards (should show increased received messages)');
    console.log('   • Recent Messages section');
    console.log('   • Contacts list');
    console.log('4. You should see the incoming messages that were just created!');
    
    console.log('\n✅ Incoming message simulation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testIncomingMessagesViaAPI();
