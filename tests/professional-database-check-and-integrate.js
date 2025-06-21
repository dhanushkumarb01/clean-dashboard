#!/usr/bin/env node
/**
 * Professional Database Integration - Find Real Data and Integrate Safely
 * This script will:
 * 1. Check both 'test' and 'telegram-dashboard' databases
 * 2. Find where your real data is located
 * 3. Add message content features to the correct database
 * 4. Update backend configuration if needed
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

async function checkDatabaseForTelegramData(mongoURI) {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    
    console.log(`🔍 Checking database: ${dbName}`);
    
    // Check for existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`   📁 Collections found: ${collectionNames.join(', ')}`);
    
    // Check for Telegram-related data
    const telegramStats = collectionNames.includes('telegramstats');
    const telegramMessages = collectionNames.includes('telegrammessages');
    const users = collectionNames.includes('users');
    const channels = collectionNames.includes('channels');
    
    let statsCount = 0;
    let messagesCount = 0;
    let usersCount = 0;
    
    if (telegramStats) {
      statsCount = await db.collection('telegramstats').countDocuments();
    }
    if (telegramMessages) {
      messagesCount = await db.collection('telegrammessages').countDocuments();
    }
    if (users) {
      usersCount = await db.collection('users').countDocuments();
    }
    
    console.log(`   📊 Telegram Stats: ${statsCount} documents`);
    console.log(`   💬 Telegram Messages: ${messagesCount} documents`);
    console.log(`   👥 Users: ${usersCount} documents`);
    
    const hasRealData = statsCount > 0 || usersCount > 0;
    const realDataScore = statsCount + usersCount + (messagesCount * 0.1);
    
    await mongoose.disconnect();
    
    return {
      dbName,
      collections: collectionNames,
      telegramStats: statsCount,
      telegramMessages: messagesCount,
      users: usersCount,
      hasRealData,
      realDataScore
    };
    
  } catch (error) {
    console.log(`   ❌ Error checking database: ${error.message}`);
    await mongoose.disconnect();
    return null;
  }
}

async function main() {
  console.log('🚀 Professional Database Check and Integration\n');
  
  // Get base connection string
  const baseURI = process.env.MONGODB_URI.split('/')[0] + '//' + process.env.MONGODB_URI.split('//')[1].split('/')[0];
  
  // Check both databases
  const testDbURI = baseURI + '/test?' + process.env.MONGODB_URI.split('?')[1];
  const telegramDbURI = process.env.MONGODB_URI; // current telegram-dashboard
  
  console.log('🔍 Scanning databases for your real Telegram data...\n');
  
  const testDbData = await checkDatabaseForTelegramData(testDbURI);
  console.log('');
  const telegramDbData = await checkDatabaseForTelegramData(telegramDbURI);
  
  console.log('\n📊 Analysis Results:');
  console.log('==================');
  
  if (testDbData) {
    console.log(`📍 TEST database: ${testDbData.realDataScore} data points`);
  }
  if (telegramDbData) {
    console.log(`📍 TELEGRAM-DASHBOARD database: ${telegramDbData.realDataScore} data points`);
  }
  
  // Determine where the real data is
  let targetDatabase = null;
  let targetURI = null;
  
  if (testDbData && telegramDbData) {
    if (testDbData.realDataScore > telegramDbData.realDataScore) {
      targetDatabase = testDbData;
      targetURI = testDbURI;
      console.log('\n✅ REAL DATA FOUND: Your data is in the TEST database');
    } else {
      targetDatabase = telegramDbData;
      targetURI = telegramDbURI;
      console.log('\n✅ REAL DATA FOUND: Your data is in the TELEGRAM-DASHBOARD database');
    }
  } else if (testDbData && testDbData.hasRealData) {
    targetDatabase = testDbData;
    targetURI = testDbURI;
    console.log('\n✅ REAL DATA FOUND: Your data is in the TEST database');
  } else if (telegramDbData && telegramDbData.hasRealData) {
    targetDatabase = telegramDbData;
    targetURI = telegramDbURI;
    console.log('\n✅ REAL DATA FOUND: Your data is in the TELEGRAM-DASHBOARD database');
  } else {
    console.log('\n❌ NO REAL DATA FOUND: No significant Telegram data in either database');
    process.exit(1);
  }
  
  console.log(`📍 Target Database: ${targetDatabase.dbName}`);
  console.log(`📊 Stats: ${targetDatabase.telegramStats} | Messages: ${targetDatabase.telegramMessages} | Users: ${targetDatabase.users}`);
  
  // Connect to the database with real data
  console.log('\n🔧 Integrating message content features...');
  
  await mongoose.connect(targetURI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
  
  const db = mongoose.connection.db;
  const messagesCollection = db.collection('telegrammessages');
  
  // Check existing messages
  const existingCount = await messagesCollection.countDocuments();
  console.log(`📊 Existing messages: ${existingCount}`);
  
  // Add 5 demo messages to show the new features
  console.log('📝 Adding 5 demo messages to demonstrate new features...');
  
  const now = Date.now();
  const demoMessages = [
    {
      messageId: `professional_demo_${now}_1`,
      chatId: '-1001111111111',
      chatName: 'Demo: Crypto Scam Alert',
      chatType: 'group',
      senderId: `demo_${now}_1`,
      senderUsername: 'cryptoscammer',
      senderFirstName: 'Demo',
      senderLastName: 'Scammer',
      messageText: 'URGENT! Bitcoin doubling! Send 1 BTC get 2 BTC back guaranteed! Limited time!',
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
      collectionBatch: 'professional_demo_features'
    },
    {
      messageId: `professional_demo_${now}_2`,
      chatId: '-1002222222222',
      chatName: 'Demo: Investment Fraud',
      chatType: 'group',
      senderId: `demo_${now}_2`,
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
      collectionBatch: 'professional_demo_features'
    },
    {
      messageId: `professional_demo_${now}_3`,
      chatId: '-1003333333333',
      chatName: 'Demo: Normal Tech Chat',
      chatType: 'group',
      senderId: `demo_${now}_3`,
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
      collectionBatch: 'professional_demo_features'
    },
    {
      messageId: `professional_demo_${now}_4`,
      chatId: '-1003333333333',
      chatName: 'Demo: Normal Tech Chat',
      chatType: 'group',
      senderId: `demo_${now}_4`,
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
      collectionBatch: 'professional_demo_features'
    },
    {
      messageId: `professional_demo_${now}_5`,
      chatId: '444444444',
      chatName: 'Demo: Private Chat',
      chatType: 'private',
      senderId: `demo_${now}_5`,
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
      collectionBatch: 'professional_demo_features'
    }
  ];
  
  const result = await messagesCollection.insertMany(demoMessages);
  console.log(`✅ Added ${result.insertedCount} demo messages`);
  
  const newTotal = await messagesCollection.countDocuments();
  console.log(`📊 Total messages now: ${newTotal} (was ${existingCount})`);
  
  // Update backend environment if needed
  if (targetDatabase.dbName === 'test' && process.env.MONGODB_URI.includes('telegram-dashboard')) {
    console.log('\n🔧 BACKEND CONFIGURATION NEEDED:');
    console.log('Your real data is in the TEST database, but backend is configured for TELEGRAM-DASHBOARD');
    console.log('');
    console.log('UPDATE your server/.env file:');
    console.log('CHANGE:');
    console.log(`MONGODB_URI=${process.env.MONGODB_URI}`);
    console.log('TO:');
    console.log(`MONGODB_URI=${testDbURI}`);
    console.log('');
    console.log('Or run this command to auto-fix:');
    console.log(`echo 'MONGODB_URI=${testDbURI}' >> server/.env.backup && sed -i 's|telegram-dashboard|test|g' server/.env`);
  } else {
    console.log('\n✅ BACKEND CONFIGURATION: Already correct');
  }
  
  await mongoose.disconnect();
  
  console.log('\n🎉 PROFESSIONAL INTEGRATION COMPLETE!');
  console.log('=====================================');
  console.log('✅ Real data preserved and located');
  console.log('✅ Demo messages added for feature testing');
  console.log('✅ Backend integration ready');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Start backend: cd server && npm start');
  console.log('2. Start frontend: npm start');
  console.log('3. Navigate to Telegram dashboard');
  console.log('4. You should see your real data + demo message features');
  console.log('');
  console.log('🗑️ To remove demo messages later:');
  console.log('   db.telegrammessages.deleteMany({collectionBatch: "professional_demo_features"})');
}

// Run the professional integration
main().catch(error => {
  console.error('❌ Professional integration failed:', error.message);
  process.exit(1);
});
