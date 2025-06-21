const http = require('http');

async function testDashboardAPI() {
  console.log('🔍 Testing Dashboard API Endpoints...\n');
  
  // Test 1: Get stats
  console.log('📊 Testing /api/whatsapp/stats...');
  await callAPI('GET', '/api/whatsapp/stats');
  
  console.log('\n📝 Testing /api/whatsapp/messages...');
  await callAPI('GET', '/api/whatsapp/messages?limit=10');
  
  console.log('\n🔄 Dashboard should now show:');
  console.log('✅ Your real number: +919000283611');
  console.log('✅ At least 2+ messages sent');
  console.log('✅ Real message counts');
  console.log('\n🌐 Refresh your dashboard in the browser now!');
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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('📄 Key Response Data:', {
            success: response.success,
            totalMessages: response.data?.totalMessages || response.data?.total,
            totalSent: response.data?.totalSent,
            totalReceived: response.data?.totalReceived,
            uniqueContacts: response.data?.uniqueContacts,
            businessPhone: response.data?.businessProfile?.displayPhoneNumber,
            businessName: response.data?.businessProfile?.verifiedName,
            recentMessagesCount: response.data?.messages?.length || 0,
            isEmpty: response.data?.isEmpty
          });
          
          if (response.success && response.data?.totalMessages > 0) {
            console.log('✅ SUCCESS! Dashboard has data');
          } else if (response.success && response.data?.totalMessages === 0) {
            console.log('⚠️  Dashboard API working but no messages found');
          } else {
            console.log('❌ API issue:', response.error);
          }
        } catch (e) {
          console.log('📄 Raw Response:', data.substring(0, 300) + '...');
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Connection Error: ${e.message}`);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

testDashboardAPI().catch(console.error);
