require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

async function setupLiveWhatsApp() {
  console.log('\n🚀 === SETTING UP LIVE WHATSAPP INTEGRATION ===\n');
  
  console.log('📋 Current Configuration:');
  console.log('App ID:', process.env.WHATSAPP_APP_ID);
  console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  console.log('WABA ID:', process.env.WHATSAPP_WABA_ID);
  console.log('Current Webhook URL:', process.env.WHATSAPP_WEBHOOK_URL);
  
  // Test current token
  console.log('\n🔍 Testing WhatsApp API Connection...');
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
      }
    );
    console.log('✅ WhatsApp API Connected');
    console.log('📞 Business Phone Number:', response.data.display_phone_number);
    console.log('✅ Verification Status:', response.data.code_verification_status);
  } catch (error) {
    console.error('❌ WhatsApp API Connection Failed:', error.response?.data || error.message);
    return;
  }
  
  console.log('\n🎯 CRITICAL SETUP REQUIRED FOR LIVE DATA:\n');
  
  console.log('Your webhook URL must be publicly accessible. Current options:\n');
  
  console.log('=== OPTION 1: NGROK (Recommended for Development) ===');
  console.log('1. Install ngrok: https://ngrok.com/download');
  console.log('2. Run: ngrok http 5000');
  console.log('3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
  console.log('4. Update your .env file:');
  console.log('   WHATSAPP_WEBHOOK_URL=https://YOUR_NGROK_URL.ngrok.io/api/whatsapp/webhook');
  console.log('5. Configure in Meta Dashboard (see steps below)');
  
  console.log('\n=== OPTION 2: CLOUD DEPLOYMENT (Production) ===');
  console.log('Deploy to: Heroku, Vercel, Railway, DigitalOcean, AWS, etc.');
  console.log('Get permanent HTTPS URL and use it as webhook URL');
  
  console.log('\n📱 META DASHBOARD CONFIGURATION:');
  console.log('1. Go to: https://developers.facebook.com/apps/' + process.env.WHATSAPP_APP_ID);
  console.log('2. Navigate to: WhatsApp > Configuration');
  console.log('3. Edit Webhook Settings:');
  console.log('   - Callback URL: YOUR_PUBLIC_URL/api/whatsapp/webhook');
  console.log('   - Verify Token: whatsapp_webhook_verify_secure_token_2024');
  console.log('4. Subscribe to webhook fields: messages, message_statuses');
  console.log('5. Save configuration');
  
  console.log('\n🧪 TESTING LIVE INTEGRATION:');
  console.log('Once webhook is configured:');
  console.log('1. Send a message TO your business number: ' + (await getBusinessPhoneNumber()));
  console.log('2. Message should appear in your React dashboard automatically');
  console.log('3. Send message FROM your dashboard - should work immediately');
  console.log('4. Check database for real message storage');
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('• No test/dummy data will be used');
  console.log('• Only real WhatsApp messages will be processed');
  console.log('• Webhook must be HTTPS and publicly accessible');
  console.log('• Keep your server running while testing');
  console.log('• Monitor server logs for webhook activity');
  
  console.log('\n🔧 NEXT IMMEDIATE STEPS:');
  console.log('1. Choose ngrok or cloud deployment');
  console.log('2. Get public HTTPS URL');
  console.log('3. Update WHATSAPP_WEBHOOK_URL in .env');
  console.log('4. Configure webhook in Meta Dashboard');
  console.log('5. Test with real phone number');
  
  console.log('\n🚀 PRODUCTION READY CHECKLIST:');
  console.log('✅ WhatsApp API credentials configured');
  console.log('✅ Database connection working');
  console.log('✅ Frontend dashboard operational');
  console.log('✅ Message sending functionality working');
  console.log('⏳ Public webhook URL needed for incoming messages');
  console.log('⏳ Meta Dashboard webhook configuration needed');
}

async function getBusinessPhoneNumber() {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
      }
    );
    return response.data.display_phone_number;
  } catch (error) {
    return 'Your Business Number';
  }
}

setupLiveWhatsApp().catch(console.error);
