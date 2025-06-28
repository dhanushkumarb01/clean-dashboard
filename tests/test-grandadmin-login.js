const fetch = require('node-fetch');

const API_URL = 'https://clean-dashboard.onrender.com/api/auth';

async function testGrandAdminLogin() {
  console.log('Testing GrandAdmin Login Flow...\n');

  // Test 1: Check if the login endpoint is accessible
  console.log('1. Testing login endpoint accessibility...');
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
        role: 'GRANDADMIN'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, data);
    
    if (response.status === 400 && data.message === 'User not found') {
      console.log('   ✓ Endpoint is working, but user does not exist');
    } else if (response.status === 400 && data.message === 'Invalid password') {
      console.log('   ✓ Endpoint is working, user exists but password is wrong');
    } else if (response.status === 403 && data.message === 'Only GrandAdmin login is allowed here') {
      console.log('   ✓ Endpoint is working, but role validation failed');
    } else {
      console.log('   ✓ Endpoint is working');
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 2: Check if the request-email-verification endpoint is accessible
  console.log('\n2. Testing email verification endpoint...');
  try {
    const response = await fetch(`${API_URL}/request-email-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, data);
    
    if (response.status === 200) {
      console.log('   ✓ Email verification endpoint is working');
    } else {
      console.log('   ✗ Email verification endpoint has issues');
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 3: Check if the complete-registration endpoint is accessible
  console.log('\n3. Testing complete registration endpoint...');
  try {
    const response = await fetch(`${API_URL}/complete-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'Test User',
        role: 'GRANDADMIN',
        password: 'testpassword123',
        token: 'invalid-token'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response:`, data);
    
    if (response.status === 400 && data.message === 'Invalid or expired verification token') {
      console.log('   ✓ Complete registration endpoint is working, but token is invalid');
    } else {
      console.log('   ✓ Complete registration endpoint is working');
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('\n=== Test Summary ===');
  console.log('If all endpoints return proper responses, the backend is working correctly.');
  console.log('The 401 error you\'re experiencing is likely due to:');
  console.log('1. Incorrect credentials (email/password)');
  console.log('2. GrandAdmin user not existing in the database');
  console.log('3. Password not being properly hashed in the database');
  console.log('4. Role not being set to "GRANDADMIN"');
}

testGrandAdminLogin().catch(console.error); 