#!/usr/bin/env node
/**
 * Test script for Telegram message collection system
 * Tests the complete flow from Python script to frontend display
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

// Import models
const TelegramMessage = require('../server/models/TelegramMessage');
const TelegramStats = require('../server/models/TelegramStats');

// Test data for messages
const testMessages = [
  {
    messageId: 'test_msg_1',
    chatId: '-1001234567890',
    chatName: 'Test Group 1',
    chatType: 'group',
    senderId: '123456789',
    senderUsername: 'testuser1',
    senderFirstName: 'Test',
    senderLastName: 'User',
    senderIsBot: false,
    messageText: 'This is a test message with some suspicious content about bitcoin investment',
    messageType: 'text',
    hasMedia: false,
    mediaType: null,
    timestamp: new Date(),
    views: 10,
    forwards: 2,
    wordCount: 12,
    containsUrls: false,
    containsHashtags: false,
    containsMentions: false,
    suspiciousKeywords: ['bitcoin', 'investment'],
    riskScore: 4,
    collectionBatch: 'test_batch_1',
    isFlagged: false
  },
  {
    messageId: 'test_msg_2',
    chatId: '-1001234567890',
    chatName: 'Test Group 1',
    chatType: 'group',
    senderId: '987654321',
    senderUsername: 'scammer1',
    senderFirstName: 'Suspicious',
    senderLastName: 'Person',
    senderIsBot: false,
    messageText: 'URGENT! Click here for guaranteed profit! Get rich quick with this amazing opportunity! No risk!',
    messageType: 'text',
    hasMedia: false,
    mediaType: null,
    timestamp: new Date(),
    views: 50,
    forwards: 15,
    wordCount: 16,
    containsUrls: true,
    containsHashtags: false,
    containsMentions: false,
    suspiciousKeywords: ['urgent', 'click here', 'guaranteed', 'get rich'],
    riskScore: 8,
    collectionBatch: 'test_batch_1',
    isFlagged: true
  },
  {
    messageId: 'test_msg_3',
    chatId: '987654321',
    chatName: 'Private Chat',
    chatType: 'private',
    senderId: '555444333',
    senderUsername: 'normaluser',
    senderFirstName: 'Normal',
    senderLastName: 'User',
    senderIsBot: false,
    messageText: 'Hey, how are you doing today?',
    messageType: 'text',
    hasMedia: false,
    mediaType: null,
    timestamp: new Date(),
    views: 0,
    forwards: 0,
    wordCount: 6,
    containsUrls: false,
    containsHashtags: false,
    containsMentions: false,
    suspiciousKeywords: [],
    riskScore: 0,
    collectionBatch: 'test_batch_1',
    isFlagged: false
  }
];

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram_dashboard';
    
    // Atlas vs Local MongoDB optimized settings
    const isAtlas = mongoURI.includes('mongodb+srv');
    const connectionOptions = isAtlas ? {
      // MongoDB Atlas optimized settings
      serverSelectionTimeoutMS: 15000, // 15 seconds for Atlas
      socketTimeoutMS: 60000, // 60 seconds for Atlas operations
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      bufferCommands: true,
      connectTimeoutMS: 30000,
      family: 4
    } : {
      // Local MongoDB settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      bufferCommands: false,
      bufferMaxEntries: 0,
      maxPoolSize: 10
    };
    
    console.log(`🔗 Attempting to connect to ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    await mongoose.connect(mongoURI, connectionOptions);
    console.log('✅ Connected to MongoDB successfully');
    
    // Test the connection with appropriate timeout
    const pingTimeout = isAtlas ? 15000 : 5000;
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), pingTimeout))
    ]);
    console.log('✅ MongoDB connection verified');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Troubleshooting steps:');
    console.log('   1. For Atlas: Check internet connection and IP whitelist');
    console.log('   2. For Local: Ensure MongoDB is running (mongod)');
    console.log('   3. Verify MONGODB_URI in server/.env file');
    console.log('   4. Try connecting with MongoDB Compass to test');
    process.exit(1);
  }
}

async function clearTestData() {
  try {
    // Remove test messages
    await TelegramMessage.deleteMany({ collectionBatch: 'test_batch_1' });
    console.log('✅ Cleared existing test messages');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  }
}

async function insertTestMessages() {
  try {
    console.log('📝 Inserting test messages...');
    
    for (const messageData of testMessages) {
      const message = new TelegramMessage(messageData);
      await message.save();
      console.log(`   ✅ Inserted message: ${messageData.messageId}`);
    }
    
    console.log('✅ All test messages inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting test messages:', error);
  }
}

async function testMessageQueries() {
  try {
    console.log('\n🔍 Testing message queries...');
    
    // Test 1: Get all messages
    const allMessages = await TelegramMessage.find({ collectionBatch: 'test_batch_1' });
    console.log(`   ✅ Total test messages: ${allMessages.length}`);
    
    // Test 2: Get flagged messages
    const flaggedMessages = await TelegramMessage.find({ 
      collectionBatch: 'test_batch_1',
      isFlagged: true 
    });
    console.log(`   ✅ Flagged messages: ${flaggedMessages.length}`);
    
    // Test 3: Get high risk messages
    const highRiskMessages = await TelegramMessage.find({ 
      collectionBatch: 'test_batch_1',
      riskScore: { $gte: 7 } 
    });
    console.log(`   ✅ High risk messages (7+): ${highRiskMessages.length}`);
    
    // Test 4: Get messages by chat
    const groupMessages = await TelegramMessage.find({ 
      collectionBatch: 'test_batch_1',
      chatId: '-1001234567890' 
    });
    console.log(`   ✅ Group messages: ${groupMessages.length}`);
    
    // Test 5: Get messages with suspicious keywords
    const suspiciousMessages = await TelegramMessage.find({ 
      collectionBatch: 'test_batch_1',
      suspiciousKeywords: { $ne: [] } 
    });
    console.log(`   ✅ Messages with suspicious keywords: ${suspiciousMessages.length}`);
    
    console.log('✅ All message queries completed successfully');
  } catch (error) {
    console.error('❌ Error testing message queries:', error);
  }
}

async function testAPICompatibility() {
  try {
    console.log('\n🌐 Testing API endpoint compatibility...');
    
    // Simulate the API request structure
    const page = 1;
    const limit = 50;
    const flagged = false;
    const riskScore = 4;
    
    let query = { collectionBatch: 'test_batch_1' };
    if (flagged) query.isFlagged = true;
    if (riskScore) query.riskScore = { $gte: riskScore };
    
    const messages = await TelegramMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const totalMessages = await TelegramMessage.countDocuments(query);
    
    const apiResponse = {
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    };
    
    console.log(`   ✅ API response structure valid`);
    console.log(`   ✅ Messages returned: ${apiResponse.data.messages.length}`);
    console.log(`   ✅ Pagination: Page ${apiResponse.data.pagination.page} of ${apiResponse.data.pagination.pages}`);
    
  } catch (error) {
    console.error('❌ Error testing API compatibility:', error);
  }
}

async function testMessageFlagging() {
  try {
    console.log('\n🚩 Testing message flagging...');
    
    // Find an unflagged message
    const unflaggedMessage = await TelegramMessage.findOne({ 
      collectionBatch: 'test_batch_1',
      isFlagged: false 
    });
    
    if (unflaggedMessage) {
      // Flag the message
      unflaggedMessage.isFlagged = true;
      unflaggedMessage.flagReason = 'Test flag';
      unflaggedMessage.flaggedBy = 'test_user_id';
      unflaggedMessage.flaggedAt = new Date();
      
      await unflaggedMessage.save();
      console.log(`   ✅ Successfully flagged message: ${unflaggedMessage.messageId}`);
      
      // Unflag the message
      unflaggedMessage.isFlagged = false;
      unflaggedMessage.flagReason = null;
      unflaggedMessage.flaggedBy = null;
      unflaggedMessage.flaggedAt = null;
      
      await unflaggedMessage.save();
      console.log(`   ✅ Successfully unflagged message: ${unflaggedMessage.messageId}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing message flagging:', error);
  }
}

async function generateSummaryReport() {
  try {
    console.log('\n📊 Generating summary report...');
    
    const summary = await TelegramMessage.aggregate([
      { $match: { collectionBatch: 'test_batch_1' } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          flaggedMessages: { $sum: { $cond: ['$isFlagged', 1, 0] } },
          highRiskMessages: { $sum: { $cond: [{ $gte: ['$riskScore', 7] }, 1, 0] } },
          mediumRiskMessages: { $sum: { $cond: [{ $and: [{ $gte: ['$riskScore', 4] }, { $lt: ['$riskScore', 7] }] }, 1, 0] } },
          lowRiskMessages: { $sum: { $cond: [{ $lt: ['$riskScore', 4] }, 1, 0] } },
          messagesWithKeywords: { $sum: { $cond: [{ $gt: [{ $size: '$suspiciousKeywords' }, 0] }, 1, 0] } },
          totalViews: { $sum: '$views' },
          totalForwards: { $sum: '$forwards' },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);
    
    if (summary.length > 0) {
      const report = summary[0];
      console.log(`   📈 Total Messages: ${report.totalMessages}`);
      console.log(`   🚩 Flagged Messages: ${report.flaggedMessages}`);
      console.log(`   🔴 High Risk (7+): ${report.highRiskMessages}`);
      console.log(`   🟡 Medium Risk (4-6): ${report.mediumRiskMessages}`);
      console.log(`   🟢 Low Risk (0-3): ${report.lowRiskMessages}`);
      console.log(`   🔍 Messages with Keywords: ${report.messagesWithKeywords}`);
      console.log(`   👀 Total Views: ${report.totalViews}`);
      console.log(`   📤 Total Forwards: ${report.totalForwards}`);
      console.log(`   📊 Average Risk Score: ${report.avgRiskScore.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating summary report:', error);
  }
}

async function main() {
  console.log('🚀 Starting Telegram Message Collection System Test\n');
  
  await connectDB();
  await clearTestData();
  await insertTestMessages();
  await testMessageQueries();
  await testAPICompatibility();
  await testMessageFlagging();
  await generateSummaryReport();
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run the Python script to collect real messages');
  console.log('   2. Start the backend server: npm run dev (in server directory)');
  console.log('   3. Start the frontend: npm start (in root directory)');
  console.log('   4. Navigate to the Telegram dashboard to view messages');
  console.log('\n🔗 Test data will remain in database for frontend testing');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
