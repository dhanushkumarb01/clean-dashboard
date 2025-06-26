const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function setupWebhook() {
  console.log('\n🔗 === WHATSAPP WEBHOOK SETUP HELPER ===\n');
  
  console.log('📋 Current Configuration:');
  console.log('WHATSAPP_WEBHOOK_URL:', process.env.WHATSAPP_WEBHOOK_URL || 'Not set');
  console.log('WHATSAPP_WEBHOOK_VERIFY_TOKEN:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'Not set');
  console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Set' : 'Not set');
  console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || 'Not set');
  
  console.log('\n🎯 STEP-BY-STEP SETUP INSTRUCTIONS:\n');
  
  console.log('1️⃣ INSTALL NGROK:');
  console.log('   • Download from: https://ngrok.com/download');
  console.log('   • Or install via npm: npm install -g ngrok');
  console.log('   • Create free account and get auth token');
  
  console.log('\n2️⃣ START YOUR SERVER:');
  console.log('   • Open terminal 1:');
  console.log('   • cd backend');
  console.log('   • npm start');
  console.log('   • Leave this running!');
  
  console.log('\n3️⃣ START NGROK TUNNEL:');
  console.log('   • Open terminal 2:');
  console.log('   • ngrok http 5000');
  console.log('   • Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
  console.log('   • Your webhook URL will be: https://abc123.ngrok.io/api/whatsapp/webhook');
  
  console.log('\n4️⃣ CONFIGURE WEBHOOK IN META DASHBOARD:');
  console.log('   • Go to: https://developers.facebook.com/');
  console.log('   • Navigate to your WhatsApp Business app');
  console.log('   • Go to WhatsApp → Configuration');
  console.log('   • Click "Edit" next to Webhook');
  console.log('   • Enter webhook URL: https://YOUR_NGROK_URL/api/whatsapp/webhook');
  console.log('   • Enter verify token: whatsapp_webhook_verify_secure_token_2024');
  console.log('   • Click "Verify and Save"');
  console.log('   • Subscribe to: messages and message_statuses');
  
  console.log('\n5️⃣ UPDATE YOUR .ENV FILE:');
  console.log('   • Update WHATSAPP_WEBHOOK_URL with your ngrok URL');
  console.log('   • Example: WHATSAPP_WEBHOOK_URL=https://abc123.ngrok.io/api/whatsapp/webhook');
  
  // Test current webhook if URL is set
  if (process.env.WHATSAPP_WEBHOOK_URL) {
    console.log('\n🧪 TESTING CURRENT WEBHOOK...');
    
    try {
      const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      
      console.log('Testing webhook verification...');
      const testUrl = `${webhookUrl}?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=${verifyToken}`;
      
      const response = await axios.get(testUrl, { timeout: 10000 });
      
      if (response.data === 'test123') {
        console.log('✅ Webhook verification test PASSED!');
        console.log('Your webhook is properly configured and accessible.');
      } else {
        console.log('❌ Webhook verification test FAILED!');
        console.log('Expected: test123');
        console.log('Received:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Webhook test FAILED!');
      console.log('Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Looks like your webhook URL is not accessible.');
        console.log('Make sure:');
        console.log('   • Your server is running');
        console.log('   • ngrok tunnel is active');
        console.log('   • URL is correct in .env file');
      }
    }
  }
  
  console.log('\n📱 TESTING INSTRUCTIONS:');
  console.log('\n🔍 Test 1: Webhook Verification');
  console.log('   • Configure webhook in Meta Dashboard');
  console.log('   • Should see "✅ WhatsApp Webhook verification successful" in server logs');
  
  console.log('\n📥 Test 2: Incoming Messages');
  console.log('   • Send message TO your WhatsApp Business number from another phone');
  console.log('   • Check server logs for "🔔 === WEBHOOK RECEIVED ==="');
  console.log('   • Message should appear in your dashboard');
  
  console.log('\n📤 Test 3: Outgoing Messages (Meta Dashboard)');
  console.log('   • Go to WhatsApp Business Manager: https://business.facebook.com/');
  console.log('   • Send message FROM Meta Dashboard to a verified number');
  console.log('   • Message should be captured via webhook');
  console.log('   • Check if message appears in your dashboard');
  
  console.log('\n🔧 DEBUGGING COMMANDS:');
  console.log('   • Test webhook directly:');
  console.log(`     curl -X GET "${process.env.WHATSAPP_WEBHOOK_URL || 'YOUR_WEBHOOK_URL'}?hub.mode=subscribe&hub.challenge=test&hub.verify_token=${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}"`);
  
  console.log('\n   • Monitor server logs:');
  console.log('     cd backend && npm start');
  console.log('     (Watch for webhook logs)');
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('   • Webhook URL must be HTTPS (not HTTP)');
  console.log('   • URL must be publicly accessible');
  console.log('   • Verify token must match exactly');
  console.log('   • Test with real phone numbers');
  console.log('   • Keep ngrok running while testing');
  console.log('   • For production, use stable hosting (not ngrok)');
  
  console.log('\n🎉 ONCE WORKING:');
  console.log('   • Messages sent from Meta Dashboard will be captured');
  console.log('   • Incoming messages will be stored in database');
  console.log('   • All messages will appear in your React dashboard');
  console.log('   • Stats will update automatically');
  
  console.log('\n' + '='.repeat(60));
  console.log('Need help? Check the webhook-setup-guide.md file for detailed instructions!');
}

// Run the setup helper
setupWebhook().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
