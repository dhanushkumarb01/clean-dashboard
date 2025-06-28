#!/usr/bin/env node
/**
 * Test Telegram API Endpoints
 * This script tests the API endpoints to ensure they return the correct data
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_PHONE = '+1234567890';

async function testTelegramAPI() {
  try {
    console.log('🧪 Testing Telegram API Endpoints\n');
    
    // Test 1: Get Telegram Stats
    console.log('1. Testing /api/telegram/stats...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/telegram/stats`, {
        params: { phone: TEST_PHONE },
        headers: {
          'Authorization': 'Bearer test-token' // You might need a valid token
        }
      });
      console.log('✅ Stats endpoint response:', {
        success: statsResponse.data.success,
        hasData: !!statsResponse.data.data,
        isEmpty: statsResponse.data.data?.isEmpty
      });
    } catch (error) {
      console.log('❌ Stats endpoint error:', error.response?.data || error.message);
    }
    
    // Test 2: Get Most Active Users
    console.log('\n2. Testing /api/telegram/most-active-users...');
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/telegram/most-active-users`, {
        params: { phone: TEST_PHONE },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Most Active Users response:', {
        success: usersResponse.data.success,
        dataLength: usersResponse.data.data?.length || 0,
        data: usersResponse.data.data
      });
    } catch (error) {
      console.log('❌ Most Active Users error:', error.response?.data || error.message);
    }
    
    // Test 3: Get Most Active Groups
    console.log('\n3. Testing /api/telegram/most-active-groups...');
    try {
      const groupsResponse = await axios.get(`${API_BASE_URL}/telegram/most-active-groups`, {
        params: { phone: TEST_PHONE },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Most Active Groups response:', {
        success: groupsResponse.data.success,
        dataLength: groupsResponse.data.data?.length || 0,
        data: groupsResponse.data.data
      });
    } catch (error) {
      console.log('❌ Most Active Groups error:', error.response?.data || error.message);
    }
    
    console.log('\n🎯 API Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTelegramAPI(); 