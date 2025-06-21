const WhatsAppTokenManager = require('./backend/utils/whatsappTokenManager');
require('dotenv').config({ path: './backend/.env' });

async function checkWhatsAppToken() {
  console.log('\n🔍 === WHATSAPP TOKEN DIAGNOSTICS ===\n');
  
  const tokenManager = new WhatsAppTokenManager();
  
  // Check if required environment variables are set
  console.log('📋 Environment Variables Check:');
  console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing');
  console.log('WHATSAPP_WABA_ID:', process.env.WHATSAPP_WABA_ID ? '✅ Set' : '❌ Missing');
  console.log('WHATSAPP_APP_ID:', process.env.WHATSAPP_APP_ID ? '✅ Set' : '❌ Missing (optional)');
  console.log('WHATSAPP_APP_SECRET:', process.env.WHATSAPP_APP_SECRET ? '✅ Set' : '❌ Missing (optional)');
  
  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    console.log('\n❌ No access token found. Please set WHATSAPP_ACCESS_TOKEN in your .env file.');
    return;
  }
  
  console.log('\n🔍 Token Details:');
  console.log('Token Length:', process.env.WHATSAPP_ACCESS_TOKEN.length);
  console.log('Token Preview:', process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 20) + '...');
  
  // Test token validation
  console.log('\n🧪 Testing Token Validation...');
  const validation = await tokenManager.validateToken();
  
  if (validation.valid) {
    console.log('✅ Token is VALID!');
    console.log('📞 Phone Number:', validation.data.display_phone_number);
    console.log('🔢 Phone Number ID:', validation.data.id);
    console.log('✅ Verification Status:', validation.data.code_verification_status);
  } else {
    console.log('❌ Token is INVALID!');
    console.log('🚨 Error:', validation.error);
    
    if (validation.code === 190) {
      console.log('\n🔄 TOKEN EXPIRED - Action Required:');
      console.log('Your WhatsApp access token has expired and needs to be refreshed.');
      
      const instructions = tokenManager.getTokenRefreshInstructions();
      console.log('\n📝 Steps to Refresh Token:');
      instructions.steps.forEach(step => console.log('   ' + step));
      
      console.log('\n💡 Important Notes:');
      instructions.notes.forEach(note => console.log('   ' + note));
      
      console.log('\n🔗 Useful Links:');
      console.log('   • Developer Dashboard:', instructions.links.developerDashboard);
      console.log('   • Documentation:', instructions.links.documentation);
    }
    
    if (validation.details) {
      console.log('\n🔧 Technical Details:');
      console.log(JSON.stringify(validation.details, null, 2));
    }
  }
  
  // Try to get token info
  console.log('\n📊 Getting Token Information...');
  const tokenInfo = await tokenManager.getTokenInfo();
  
  if (tokenInfo.success) {
    console.log('✅ Token Info Retrieved:');
    console.log('   • App ID:', tokenInfo.data.app_id);
    console.log('   • User ID:', tokenInfo.data.user_id);
    console.log('   • Expires At:', new Date(tokenInfo.data.expires_at * 1000).toLocaleString());
    console.log('   • Is Valid:', tokenInfo.data.is_valid);
    console.log('   • Scopes:', tokenInfo.data.scopes?.join(', ') || 'None');
  } else {
    console.log('❌ Could not retrieve token info:', tokenInfo.error);
  }
  
  // Test full connection
  console.log('\n🔗 Testing Full API Connection...');
  const connectionTest = await tokenManager.testConnection();
  
  if (connectionTest.valid) {
    console.log('✅ API Connection Successful!');
    console.log('📱 Business Account:', connectionTest.businessAccount.name);
    console.log('📞 Phone Number:', connectionTest.phoneNumber.display_phone_number);
  } else {
    console.log('❌ API Connection Failed:', connectionTest.error);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (!validation.valid) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Go to https://developers.facebook.com/');
    console.log('2. Navigate to your WhatsApp Business app');
    console.log('3. Go to WhatsApp > Getting Started');
    console.log('4. Generate a new temporary access token');
    console.log('5. Update your .env file with the new token');
    console.log('6. Restart your server');
    console.log('7. Run this script again to verify');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('• Temporary tokens expire after 24 hours');
    console.log('• For production, consider setting up a system user token');
    console.log('• Never commit tokens to version control');
  } else {
    console.log('\n🎉 Your WhatsApp integration is working correctly!');
    console.log('You can now send messages through your application.');
  }
}

// Run the check
checkWhatsAppToken().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
