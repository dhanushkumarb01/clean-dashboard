const http = require('http');

// Test all the debugging endpoints to trace the data flow
async function runDebugTests() {
  console.log('🔍 === WhatsApp Debug Flow Testing ===\n');
  
  // Test 1: Database Connection
  console.log('🧪 Test 1: Database Connection');
  await testEndpoint('GET', '/api/whatsapp/ping-db');
  
  // Test 2: Send Message (this should save to DB)
  console.log('\n🧪 Test 2: Send Message');
  await testEndpoint('POST', '/api/whatsapp/send-message', {
    to: '+919000283611',
    message: 'Debug test message - this should appear in database and dashboard!'
  });
  
  // Test 3: Check Dashboard Stats
  console.log('\n🧪 Test 3: Dashboard Stats');
  await testEndpoint('GET', '/api/whatsapp/stats', null, true); // requires auth
  
  console.log('\n✅ Debug tests completed!');
  console.log('📋 What to check:');
  console.log('1. Look at your backend terminal for detailed logs');
  console.log('2. Check if database saves are working');
  console.log('3. Refresh your dashboard to see if data appears');
  console.log('4. Send a WhatsApp message to your business number to test webhooks');
}

function testEndpoint(method, path, body = null, requiresAuth = false) {
  return new Promise((resolve, reject) => {
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
    if (body) console.log('📦 Body:', JSON.stringify(body, null, 2));

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
        } catch (e) {
          console.log('📄 Raw Response:', data);
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

// Run the tests
runDebugTests().catch(console.error);
