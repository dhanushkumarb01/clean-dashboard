const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '+1234567890';
const TEST_MESSAGE = `Test message ${Date.now()}`;

async function testImmediateMessageSave() {
  console.log('🧪 Testing immediate message save and stats update...');
  
  try {
    // 1. Get initial stats
    console.log('\n📊 Step 1: Getting initial stats...');
    const initialStatsResponse = await axios.get(`${API_BASE_URL}/whatsapp/stats`);
    const initialStats = initialStatsResponse.data.data;
    console.log('Initial stats:', {
      totalMessages: initialStats.totalMessages,
      totalSent: initialStats.totalSent,
      uniqueContacts: initialStats.uniqueContacts
    });

    // 2. Send a test message
    console.log('\n📤 Step 2: Sending test message...');
    const sendStart = Date.now();
    const sendResponse = await axios.post(`${API_BASE_URL}/whatsapp/send-message`, {
      to: TEST_PHONE,
      message: TEST_MESSAGE
    });
    const sendDuration = Date.now() - sendStart;
    
    console.log(`✅ Message sent in ${sendDuration}ms`);
    console.log('Response:', {
      success: sendResponse.data.success,
      messageId: sendResponse.data.data.messageId,
      timestamp: sendResponse.data.data.timestamp
    });

    // 3. Immediately check stats (should be updated by background process)
    console.log('\n📊 Step 3: Getting updated stats immediately...');
    const updatedStatsResponse = await axios.get(`${API_BASE_URL}/whatsapp/stats`);
    const updatedStats = updatedStatsResponse.data.data;
    console.log('Updated stats:', {
      totalMessages: updatedStats.totalMessages,
      totalSent: updatedStats.totalSent,
      uniqueContacts: updatedStats.uniqueContacts
    });

    // 4. Check if stats were updated
    const messageCountIncreased = updatedStats.totalMessages > initialStats.totalMessages;
    const sentCountIncreased = updatedStats.totalSent > initialStats.totalSent;
    
    console.log('\n✅ Results:');
    console.log(`Total messages increased: ${messageCountIncreased} (${initialStats.totalMessages} → ${updatedStats.totalMessages})`);
    console.log(`Sent messages increased: ${sentCountIncreased} (${initialStats.totalSent} → ${updatedStats.totalSent})`);
    
    if (messageCountIncreased && sentCountIncreased) {
      console.log('🎉 SUCCESS: Stats updated immediately!');
    } else {
      console.log('⚠️  WARNING: Stats may not have updated yet, checking again in 2 seconds...');
      
      // Wait and check again
      setTimeout(async () => {
        try {
          const finalStatsResponse = await axios.get(`${API_BASE_URL}/whatsapp/stats`);
          const finalStats = finalStatsResponse.data.data;
          
          const finalMessageCountIncreased = finalStats.totalMessages > initialStats.totalMessages;
          const finalSentCountIncreased = finalStats.totalSent > initialStats.totalSent;
          
          console.log('\n📊 Final check:');
          console.log(`Total messages increased: ${finalMessageCountIncreased} (${initialStats.totalMessages} → ${finalStats.totalMessages})`);
          console.log(`Sent messages increased: ${finalSentCountIncreased} (${initialStats.totalSent} → ${finalStats.totalSent})`);
          
          if (finalMessageCountIncreased && finalSentCountIncreased) {
            console.log('🎉 SUCCESS: Stats updated after background processing!');
          } else {
            console.log('❌ FAILED: Stats still not updated');
          }
        } catch (error) {
          console.error('Error in final check:', error.message);
        }
      }, 2000);
    }

    // 5. Get recent messages to verify message was saved
    console.log('\n📋 Step 4: Checking recent messages...');
    const messagesResponse = await axios.get(`${API_BASE_URL}/whatsapp/messages?limit=5`);
    const recentMessages = messagesResponse.data.data.messages;
    
    const testMessageFound = recentMessages.some(msg => 
      msg.message === TEST_MESSAGE && msg.to === TEST_PHONE
    );
    
    console.log(`Test message found in recent messages: ${testMessageFound}`);
    if (testMessageFound) {
      console.log('✅ Message successfully saved to database');
    } else {
      console.log('❌ Message not found in recent messages');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testImmediateMessageSave();
