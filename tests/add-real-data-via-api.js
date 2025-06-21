const http = require('http');

async function addRealDataViaAPI() {
  console.log('🔧 Adding Real Data via Backend API...\n');
  
  // Your real phone number
  const yourNumber = '+919000283611';
  
  // Test 1: Add test data through the API (this should work since DB connection is established)
  console.log('🧪 Step 1: Testing API data insertion...');
  await callAPI('POST', '/api/whatsapp/add-test-data');
  
  // Test 2: Send a real message from business to your number
  console.log('\n🧪 Step 2: Sending message to your number...');
  await callAPI('POST', '/api/whatsapp/send-message', {
    to: yourNumber,
    message: 'Welcome to your WhatsApp Dashboard! This message is now tracked in real-time analytics.'
  });
  
  // Test 3: Check if data appears
  console.log('\n🧪 Step 3: Checking dashboard stats...');
  await callAPI('GET', '/api/whatsapp/stats', null, true);
  
  console.log('\n✅ Data insertion complete!');
  console.log('🔄 Now refresh your WhatsApp dashboard to see:');
  console.log(`📱 Your phone number: ${yourNumber}`);
  console.log('📊 Real message counts');
  console.log('📈 Updated analytics');
}

function callAPI(method, path, body = null, requiresAuth = false) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        ...(requiresAuth && { 'Authorization': 'Bearer test-token' })
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
            console.log('✅ Success!');
          } else {
            console.log('❌ Failed:', response.error);
          }
        } catch (e) {
          console.log('📄 Raw Response:', data.substring(0, 200) + '...');
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Add delay between calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Modified version with delays
async function addRealDataViaAPIWithDelays() {
  console.log('🔧 Adding Real Data via Backend API...\n');
  
  const yourNumber = '+919000283611';
  
  console.log('🧪 Step 1: Testing database connection...');
  await callAPI('GET', '/api/whatsapp/ping-db');
  await delay(2000);
  
  console.log('\n🧪 Step 2: Sending message to your number...');
  await callAPI('POST', '/api/whatsapp/send-message', {
    to: yourNumber,
    message: 'Real WhatsApp message for dashboard testing - sent to +919000283611'
  });
  await delay(2000);
  
  console.log('\n🧪 Step 3: Sending another message...');
  await callAPI('POST', '/api/whatsapp/send-message', {
    to: yourNumber,
    message: 'Second test message - your dashboard should now show 2 messages sent to your real number!'
  });
  await delay(2000);
  
  console.log('\n🧪 Step 4: Checking updated stats...');
  await callAPI('GET', '/api/whatsapp/stats', null, true);
  
  console.log('\n🎉 Real data addition complete!');
  console.log(`📱 Messages sent to: ${yourNumber}`);
  console.log('🔄 Refresh your dashboard to see real data with your phone number!');
}

// Run the enhanced version
addRealDataViaAPIWithDelays().catch(console.error);
