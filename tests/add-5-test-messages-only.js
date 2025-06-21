#!/usr/bin/env node
/**
 * Add ONLY 5 test messages to existing real data
 * Does NOT change any existing data or dashboard code
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

async function main() {
  try {
    console.log('🚀 Adding 5 Test Messages to Existing Real Data\n');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database and collection
    const db = mongoose.connection.db;
    const messagesCollection = db.collection('telegrammessages');
    
    // Check existing data first
    const existingCount = await messagesCollection.countDocuments();
    console.log(`📊 Existing messages in database: ${existingCount}`);
    
    // Create ONLY 5 test messages to add to existing data
    console.log('📝 Adding 5 test messages to demonstrate message content features...');
    
    const testMessages = [
      {
        messageId: `demo_msg_${Date.now()}_1`,
        chatId: '-1001111111111',
        chatName: 'Demo Crypto Group',
        chatType: 'group',
        senderId: `demo_user_${Date.now()}_1`,
        senderUsername: 'cryptoscammer',
        senderFirstName: 'Demo',
        senderLastName: 'Scammer',
        messageText: 'URGENT! Bitcoin doubling scheme! Send 1 BTC get 2 BTC back guaranteed! Limited time offer!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
        wordCount: 16,
        riskScore: 9,
        suspiciousKeywords: ['urgent', 'guaranteed', 'limited time'],
        isFlagged: true,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 89,
        forwards: 15,
        collectionBatch: 'demo_message_features'
      },
      {
        messageId: `demo_msg_${Date.now()}_2`,
        chatId: '-1001111111111',
        chatName: 'Demo Crypto Group',
        chatType: 'group',
        senderId: `demo_user_${Date.now()}_2`,
        senderUsername: 'normaltrader',
        senderFirstName: 'Normal',
        senderLastName: 'Trader',
        messageText: 'What are your thoughts on the current market analysis? Any good technical indicators?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        wordCount: 14,
        riskScore: 0,
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 23,
        forwards: 0,
        collectionBatch: 'demo_message_features'
      },
      {
        messageId: `demo_msg_${Date.now()}_3`,
        chatId: '-1002222222222',
        chatName: 'Demo Tech Chat',
        chatType: 'group',
        senderId: `demo_user_${Date.now()}_3`,
        senderUsername: 'fraudster',
        senderFirstName: 'Fake',
        senderLastName: 'Investment',
        messageText: 'Get rich quick! Free money! No risk investment opportunity! Click here for instant profit!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 mins ago
        wordCount: 15,
        riskScore: 8,
        suspiciousKeywords: ['get rich', 'free money', 'click here'],
        isFlagged: true,
        hasMedia: false,
        containsUrls: true,
        containsHashtags: false,
        containsMentions: false,
        views: 156,
        forwards: 23,
        collectionBatch: 'demo_message_features'
      },
      {
        messageId: `demo_msg_${Date.now()}_4`,
        chatId: '-1002222222222',
        chatName: 'Demo Tech Chat',
        chatType: 'group',
        senderId: `demo_user_${Date.now()}_4`,
        senderUsername: 'developer',
        senderFirstName: 'Good',
        senderLastName: 'Developer',
        messageText: 'Check out this new JavaScript framework for React development #coding #webdev',
        messageType: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
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
        collectionBatch: 'demo_message_features'
      },
      {
        messageId: `demo_msg_${Date.now()}_5`,
        chatId: '333333333',
        chatName: 'Demo Private Chat',
        chatType: 'private',
        senderId: `demo_user_${Date.now()}_5`,
        senderUsername: 'friend',
        senderFirstName: 'Demo',
        senderLastName: 'Friend',
        messageText: 'Hey! How is your project going? Let me know if you need any help.',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
        wordCount: 13,
        riskScore: 0,
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 0,
        forwards: 0,
        collectionBatch: 'demo_message_features'
      }
    ];
    
    // Insert ONLY these 5 messages (don't touch existing data)
    const result = await messagesCollection.insertMany(testMessages);
    console.log(`✅ Added ${result.insertedCount} demo messages to existing data`);
    
    // Verify total count now
    const newTotalCount = await messagesCollection.countDocuments();
    console.log(`📊 Total messages now: ${newTotalCount} (was ${existingCount})`);
    
    // Show what was added
    const demoCount = await messagesCollection.countDocuments({ collectionBatch: 'demo_message_features' });
    const flaggedDemo = await messagesCollection.countDocuments({ 
      collectionBatch: 'demo_message_features',
      isFlagged: true 
    });
    
    console.log(`\n🎯 Demo messages added: ${demoCount}`);
    console.log(`🚩 Flagged demo messages: ${flaggedDemo}`);
    console.log(`🔴 High-risk demo messages: 2`);
    
    console.log('\n✅ SUCCESS!');
    console.log('📋 What you can now see:');
    console.log('   1. All your existing real data is unchanged');
    console.log('   2. 5 demo messages added to test message content features');
    console.log('   3. You can now see flagging, risk scores, and filtering in action');
    console.log('   4. Demo messages are clearly marked with "demo_message_features" batch');
    
    console.log('\n🔍 To remove demo messages later, run:');
    console.log('   db.telegrammessages.deleteMany({collectionBatch: "demo_message_features"})');
    
  } catch (error) {
    console.error('❌ Error adding demo messages:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
