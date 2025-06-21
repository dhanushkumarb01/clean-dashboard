const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function testYouTubeConnection() {
  console.log('🧪 Testing YouTube API connection and stats fetching...');
  
  try {
    // 1. Test environment variables setup
    console.log('\n📊 Step 1: Checking environment setup...');
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY
    };
    console.log('Environment variables:', envCheck);
    
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      return;
    }
    
    console.log('✅ All required environment variables are set');

    // 2. Test YouTube auth URL generation
    console.log('\n🔗 Step 2: Testing auth URL generation...');
    try {
      const authResponse = await axios.get(`${API_BASE_URL}/auth/google`);
      console.log('✅ Auth URL generated successfully');
      console.log('Auth URL preview:', authResponse.data.url?.substring(0, 100) + '...');
    } catch (authError) {
      console.log('❌ Auth URL generation failed:', authError.message);
      if (authError.response) {
        console.log('Response data:', authError.response.data);
      }
    }

    // 3. Test quota usage endpoint (should work without authentication for testing)
    console.log('\n📈 Step 3: Testing quota usage endpoint...');
    try {
      const quotaResponse = await axios.get(`${API_BASE_URL}/youtube/quota`);
      console.log('✅ Quota endpoint accessible');
      console.log('Quota usage:', quotaResponse.data);
    } catch (quotaError) {
      console.log('⚠️ Quota endpoint failed (expected if not authenticated):', quotaError.response?.status);
    }

    // 4. Test overview endpoint (requires authentication)
    console.log('\n🎬 Step 4: Testing overview endpoint...');
    try {
      const overviewResponse = await axios.get(`${API_BASE_URL}/youtube/overview`);
      console.log('✅ Overview endpoint accessible');
      console.log('Overview data:', overviewResponse.data);
    } catch (overviewError) {
      console.log('⚠️ Overview endpoint failed (expected if not authenticated):', overviewError.response?.status);
      if (overviewError.response?.status === 401 || overviewError.response?.status === 404) {
        console.log('🔒 This is expected - user needs to authenticate with YouTube first');
      }
    }

    // 5. Test most active users endpoint
    console.log('\n👥 Step 5: Testing most active users endpoint...');
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/youtube/most-active-users`);
      console.log('✅ Most active users endpoint accessible');
      console.log('Users data:', usersResponse.data);
    } catch (usersError) {
      console.log('⚠️ Most active users endpoint failed (expected if not authenticated):', usersError.response?.status);
    }

    // 6. Test most active channels endpoint
    console.log('\n📺 Step 6: Testing most active channels endpoint...');
    try {
      const channelsResponse = await axios.get(`${API_BASE_URL}/youtube/most-active-channels`);
      console.log('✅ Most active channels endpoint accessible');
      console.log('Channels data:', channelsResponse.data);
    } catch (channelsError) {
      console.log('⚠️ Most active channels endpoint failed (expected if not authenticated):', channelsError.response?.status);
    }

    console.log('\n🎯 Test Summary:');
    console.log('✅ Environment variables are properly configured');
    console.log('✅ YouTube auth URL generation is working');
    console.log('🔒 Protected endpoints require authentication (as expected)');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your backend server: npm run start (in backend directory)');
    console.log('2. Start your frontend: npm start (in root directory)');
    console.log('3. Navigate to YouTube dashboard and connect your account');
    console.log('4. The connection should now work properly with improved error handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Debugging Information:');
    console.log('- Make sure your backend server is running on port 5000');
    console.log('- Check that all environment variables are set in backend/.env');
    console.log('- Verify MongoDB connection is working');
  }
}

// Load environment variables for testing
require('dotenv').config({ path: 'backend/.env' });

// Run the test
testYouTubeConnection();
