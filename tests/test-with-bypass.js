const http = require('http');

// Test with the new bypass endpoint
async function testWithBypass() {
  console.log('🧪 Testing WhatsApp with Auth Bypass...\n');
  
  // Test 1: Send message to your real number (no auth required)
  console.log('📱 Sending message to your number (+919000283611)...');
  await callAPI('POST', '/api/whatsapp/test-send-message', {
    to: '+919000283611',
    message: 'Real test message sent to your actual phone number! This should appear in your dashboard.'
  });
  
  console.log('\n⏳ Waiting 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Send another message
  console.log('📱 Sending second message...');
  await callAPI('POST', '/api/whatsapp/test-send-message', {
    to: '+919000283611',
    message: 'Second real message! Your dashboard should now show 2+ messages sent to +919000283611'
  });
  
  console.log('\n🎉 Test Complete!');
  console.log('✅ Check your backend terminal logs for detailed output');
  console.log('✅ Check your WhatsApp phone for received messages');
  console.log('🔄 Refresh your dashboard - it should show your real number now!');
}

function callAPI(method, path, body = null) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    console.log(`📞 ${method} http://localhost:5000${path}`);
    if (body) {
      console.log('📦 Body:', JSON.stringify(body, null, 2));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('📄 Response:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('✅ SUCCESS! Message sent and saved to database');
            if (response.data && response.data.messageId) {
              console.log(`📝 Message ID: ${response.data.messageId}`);
            }
          } else {
            console.log('❌ FAILED:', response.error);
          }
        } catch (e) {
          console.log('📄 Raw Response:', data.substring(0, 200) + '...');
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Connection Error: ${e.message}`);
      console.log('💡 Make sure your backend server is running on port 5000');
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

testWithBypass().catch(console.error);
