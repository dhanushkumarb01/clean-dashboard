const http = require('http');

// Test sending a message through our backend API
const testMessage = {
  to: "+919000283611",
  message: "Test message from dashboard backend - this should appear in MongoDB!",
  messageType: "text"
};

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/whatsapp/send-message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer dummy-token-for-test' // We'll need to handle auth
  }
};

console.log('Testing WhatsApp message sending through backend...');
console.log('Message:', testMessage);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n✅ Message sent successfully!');
        console.log('Message ID:', response.data.messageId);
        console.log('🔄 Check your WhatsApp dashboard - the message should now appear in the stats!');
      } else {
        console.log('\n❌ Message failed to send');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.log('Make sure the backend server is running on port 5000');
});

req.write(postData);
req.end();
