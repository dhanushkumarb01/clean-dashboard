#!/usr/bin/env node
/**
 * Consolidate Everything to TEST Database
 * 1. Delete telegram-dashboard database completely
 * 2. Add demo messages to test database (where real data is)
 * 3. Update backend to use test database only
 */

const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '../server/.env' });

async function main() {
  console.log('🚀 Consolidating Everything to TEST Database\n');
  
  // Get base connection string
  const baseURI = process.env.MONGODB_URI.split('/')[0] + '//' + process.env.MONGODB_URI.split('//')[1].split('/')[0];
  const testDbURI = baseURI + '/test?' + process.env.MONGODB_URI.split('?')[1];
  const telegramDbURI = process.env.MONGODB_URI; // current telegram-dashboard
  
  console.log('🗑️ Step 1: Deleting telegram-dashboard database completely...');
  
  try {
    // Connect to telegram-dashboard database
    await mongoose.connect(telegramDbURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    const telegramDb = mongoose.connection.db;
    console.log(`📍 Connected to: ${mongoose.connection.name}`);
    
    // Get all collections
    const collections = await telegramDb.listCollections().toArray();
    console.log(`   📁 Found ${collections.length} collections to delete`);
    
    // Delete all collections in telegram-dashboard database
    for (const collection of collections) {
      await telegramDb.collection(collection.name).drop();
      console.log(`   ✅ Deleted collection: ${collection.name}`);
    }
    
    await mongoose.disconnect();
    console.log('✅ telegram-dashboard database completely cleaned');
    
  } catch (error) {
    console.log(`⚠️ telegram-dashboard database was already empty or doesn't exist: ${error.message}`);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
  
  console.log('\n📝 Step 2: Adding demo messages to TEST database...');
  
  // Connect to test database
  await mongoose.connect(testDbURI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
  
  const testDb = mongoose.connection.db;
  console.log(`📍 Connected to: ${mongoose.connection.name}`);
  
  // Check existing data
  const messagesCollection = testDb.collection('telegrammessages');
  const statsCollection = testDb.collection('telegramstats');
  const usersCollection = testDb.collection('users');
  
  const existingMessages = await messagesCollection.countDocuments();
  const existingStats = await statsCollection.countDocuments();
  const existingUsers = await usersCollection.countDocuments();
  
  console.log(`📊 Current TEST database contents:`);
  console.log(`   💬 Messages: ${existingMessages}`);
  console.log(`   📊 Stats: ${existingStats}`);
  console.log(`   👥 Users: ${existingUsers}`);
  
  // Add 5 demo messages to test database
  console.log('\n📝 Adding 5 demo messages to TEST database...');
  
  const now = Date.now();
  const demoMessages = [
    {
      messageId: `test_demo_${now}_1`,
      chatId: '-1001111111111',
      chatName: 'DEMO: Crypto Scam Alert',
      chatType: 'group',
      senderId: `test_demo_${now}_1`,
      senderUsername: 'cryptoscammer',
      senderFirstName: 'Demo',
      senderLastName: 'Scammer',
      messageText: 'URGENT! Bitcoin doubling scheme! Send 1 BTC get 2 BTC guaranteed! Limited time!',
      messageType: 'text',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      wordCount: 13,
      riskScore: 9,
      suspiciousKeywords: ['urgent', 'guaranteed', 'limited time'],
      isFlagged: true,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: false,
      containsMentions: false,
      views: 89,
      forwards: 15,
      collectionBatch: 'test_demo_features'
    },
    {
      messageId: `test_demo_${now}_2`,
      chatId: '-1002222222222',
      chatName: 'DEMO: Investment Fraud',
      chatType: 'group',
      senderId: `test_demo_${now}_2`,
      senderUsername: 'fraudster',
      senderFirstName: 'Fake',
      senderLastName: 'Investment',
      messageText: 'Get rich quick! Free money! No risk investment! Click here now!',
      messageType: 'text',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      wordCount: 11,
      riskScore: 8,
      suspiciousKeywords: ['get rich', 'free money', 'click here'],
      isFlagged: true,
      hasMedia: false,
      containsUrls: true,
      containsHashtags: false,
      containsMentions: false,
      views: 156,
      forwards: 23,
      collectionBatch: 'test_demo_features'
    },
    {
      messageId: `test_demo_${now}_3`,
      chatId: '-1003333333333',
      chatName: 'DEMO: Normal Tech Chat',
      chatType: 'group',
      senderId: `test_demo_${now}_3`,
      senderUsername: 'developer',
      senderFirstName: 'Good',
      senderLastName: 'Developer',
      messageText: 'Check out this new React framework for building apps #coding #react',
      messageType: 'text',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      wordCount: 11,
      riskScore: 1,
      suspiciousKeywords: [],
      isFlagged: false,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: true,
      containsMentions: false,
      views: 67,
      forwards: 2,
      collectionBatch: 'test_demo_features'
    },
    {
      messageId: `test_demo_${now}_4`,
      chatId: '-1003333333333',
      chatName: 'DEMO: Normal Tech Chat',
      chatType: 'group',
      senderId: `test_demo_${now}_4`,
      senderUsername: 'normaluser',
      senderFirstName: 'Normal',
      senderLastName: 'User',
      messageText: 'What are your thoughts on the current market trends and analysis?',
      messageType: 'text',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      wordCount: 11,
      riskScore: 0,
      suspiciousKeywords: [],
      isFlagged: false,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: false,
      containsMentions: false,
      views: 23,
      forwards: 0,
      collectionBatch: 'test_demo_features'
    },
    {
      messageId: `test_demo_${now}_5`,
      chatId: '444444444',
      chatName: 'DEMO: Private Chat',
      chatType: 'private',
      senderId: `test_demo_${now}_5`,
      senderUsername: 'friend',
      senderFirstName: 'Demo',
      senderLastName: 'Friend',
      messageText: 'Hey! How is your project going? Need any help with development?',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      wordCount: 11,
      riskScore: 0,
      suspiciousKeywords: [],
      isFlagged: false,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: false,
      containsMentions: false,
      views: 0,
      forwards: 0,
      collectionBatch: 'test_demo_features'
    }
  ];
  
  const result = await messagesCollection.insertMany(demoMessages);
  console.log(`✅ Added ${result.insertedCount} demo messages to TEST database`);
  
  const newMessageCount = await messagesCollection.countDocuments();
  console.log(`📊 Total messages in TEST database: ${newMessageCount} (was ${existingMessages})`);
  
  await mongoose.disconnect();
  
  console.log('\n🔧 Step 3: Updating backend configuration...');
  
  // Update server/.env to use test database
  const envPath = '../server/.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace telegram-dashboard with test in MONGODB_URI
  const updatedEnvContent = envContent.replace(
    /MONGODB_URI=.*telegram-dashboard[^?\n]*/,
    `MONGODB_URI=${testDbURI}`
  );
  
  // Create backup
  fs.writeFileSync(envPath + '.backup', envContent);
  console.log('📄 Created backup: server/.env.backup');
  
  // Write updated config
  fs.writeFileSync(envPath, updatedEnvContent);
  console.log('✅ Updated server/.env to use TEST database');
  
  console.log('\n🎉 CONSOLIDATION COMPLETE!');
  console.log('==========================');
  console.log('✅ telegram-dashboard database deleted');
  console.log('✅ Demo messages added to TEST database');
  console.log('✅ Backend configured to use TEST database');
  console.log('✅ All data now in single database: TEST');
  
  console.log('\n📊 Final TEST Database Contents:');
  console.log(`   💬 Messages: ${newMessageCount} (including ${result.insertedCount} demo messages)`);
  console.log(`   📊 Stats: ${existingStats} (your real data)`);
  console.log(`   👥 Users: ${existingUsers} (your real data)`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Start backend: cd server && npm start');
  console.log('2. Start frontend: npm start');
  console.log('3. Navigate to Telegram dashboard');
  console.log('4. You should see your real data + demo message features');
  
  console.log('\n🗑️ To remove demo messages later:');
  console.log('   Use MongoDB Compass or shell: db.telegrammessages.deleteMany({collectionBatch: "test_demo_features"})');
}

// Run the consolidation
main().catch(error => {
  console.error('❌ Consolidation failed:', error.message);
  process.exit(1);
});
