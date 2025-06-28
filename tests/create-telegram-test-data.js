#!/usr/bin/env node
/**
 * Create Test Data for Telegram Dashboard
 * This creates sample data so you can see the dashboard working
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './server/config/server.env' });

async function main() {
  try {
    console.log('🚀 Creating Telegram Test Data for Dashboard\n');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database and collections
    const db = mongoose.connection.db;
    const messagesCollection = db.collection('telegrammessages');
    const statsCollection = db.collection('telegramstats');
    
    // 1. Create sample Telegram messages
    console.log('📝 Creating sample Telegram messages...');
    
    const sampleMessages = [
      {
        messageId: 'msg_001',
        chatId: '-1001234567890',
        chatName: 'Crypto Trading Group',
        chatType: 'group',
        senderId: '123456789',
        senderUsername: 'cryptotrader',
        senderFirstName: 'John',
        senderLastName: 'Trader',
        messageText: 'URGENT! Bitcoin investment opportunity! Guaranteed 500% profit in 24 hours! Click here now!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        wordCount: 15,
        riskScore: 8,
        suspiciousKeywords: ['urgent', 'guaranteed', 'click here'],
        isFlagged: true,
        hasMedia: false,
        containsUrls: true,
        containsHashtags: false,
        containsMentions: false,
        views: 245,
        forwards: 12,
        collectionBatch: 'dashboard_demo'
      },
      {
        messageId: 'msg_002',
        chatId: '-1001234567890',
        chatName: 'Crypto Trading Group',
        chatType: 'group',
        senderId: '987654321',
        senderUsername: 'normaluser',
        senderFirstName: 'Alice',
        senderLastName: 'Smith',
        messageText: 'What do you think about the current market trends? Any good analysis?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        wordCount: 12,
        riskScore: 0,
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 89,
        forwards: 0,
        collectionBatch: 'dashboard_demo'
      },
      {
        messageId: 'msg_003',
        chatId: '-1001987654321',
        chatName: 'Tech Discussion',
        chatType: 'group',
        senderId: '555666777',
        senderUsername: 'techguru',
        senderFirstName: 'Bob',
        senderLastName: 'Developer',
        messageText: 'Check out this new JavaScript framework! #coding #webdev',
        messageType: 'text',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        wordCount: 9,
        riskScore: 1,
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: true,
        containsMentions: false,
        views: 156,
        forwards: 3,
        collectionBatch: 'dashboard_demo'
      },
      {
        messageId: 'msg_004',
        chatId: '-1001987654321',
        chatName: 'Tech Discussion',
        chatType: 'group',
        senderId: '888999000',
        senderUsername: 'scammer2',
        senderFirstName: 'Fake',
        senderLastName: 'Person',
        messageText: 'Free money! No risk investment! Get rich quick scheme! Lottery winner!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
        wordCount: 11,
        riskScore: 9,
        suspiciousKeywords: ['free money', 'get rich', 'lottery'],
        isFlagged: true,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 67,
        forwards: 8,
        collectionBatch: 'dashboard_demo'
      },
      {
        messageId: 'msg_005',
        chatId: '111222333',
        chatName: 'Private Chat',
        chatType: 'private',
        senderId: '444555666',
        senderUsername: 'friend',
        senderFirstName: 'Sarah',
        senderLastName: 'Johnson',
        messageText: 'Hey! How was your day? Want to grab coffee later?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        wordCount: 10,
        riskScore: 0,
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 0,
        forwards: 0,
        collectionBatch: 'dashboard_demo'
      }
    ];
    
    // Clear existing demo data
    await messagesCollection.deleteMany({ collectionBatch: 'dashboard_demo' });
    
    // Insert sample messages
    const messageResult = await messagesCollection.insertMany(sampleMessages);
    console.log(`✅ Created ${messageResult.insertedCount} sample messages`);
    
    // 2. Create sample Telegram stats
    console.log('📊 Creating sample Telegram statistics...');
    
    const sampleStats = {
      phone: '+1234567890', // Add phone field for API queries
      totalGroups: 3,
      activeUsers: 25,
      totalUsers: 156,
      totalMessages: 1247,
      totalMediaFiles: 89,
      messageRate: 178.14,
      rateChange: 12.5,
      groupPropagation: 85.7,
      avgViewsPerMessage: 127.3,
      mostActiveUsers: [
        {
          userId: '123456789',
          username: 'cryptotrader',
          firstName: 'John',
          lastName: 'Trader',
          telegramId: '123456789',
          messageCount: 245
        },
        {
          userId: '987654321',
          username: 'normaluser',
          firstName: 'Alice',
          lastName: 'Smith',
          telegramId: '987654321',
          messageCount: 89
        },
        {
          userId: '555666777',
          username: 'techguru',
          firstName: 'Bob',
          lastName: 'Developer',
          telegramId: '555666777',
          messageCount: 67
        }
      ],
      mostActiveGroups: [
        {
          groupId: '-1001234567890',
          title: 'Crypto Trading Group',
          username: 'cryptotraders',
          isChannel: false,
          memberCount: 1256,
          messageCount: 567
        },
        {
          groupId: '-1001987654321',
          title: 'Tech Discussion',
          username: 'techdiscussion',
          isChannel: false,
          memberCount: 789,
          messageCount: 234
        }
      ],
      topUsersByGroups: [],
      collectionPeriod: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date()
      },
      timestamp: new Date()
    };
    
    // Clear existing demo stats
    await statsCollection.deleteMany({ 
      $or: [
        { 'mostActiveUsers.0.messageCount': { $exists: true } },
        { phone: '+1234567890' }
      ]
    });
    
    // Insert sample stats
    const statsResult = await statsCollection.insertOne(sampleStats);
    console.log(`✅ Created sample statistics`);
    
    // 3. Verify data
    console.log('\n🔍 Verifying created data...');
    
    const messageCount = await messagesCollection.countDocuments({ collectionBatch: 'dashboard_demo' });
    const flaggedCount = await messagesCollection.countDocuments({ 
      collectionBatch: 'dashboard_demo',
      isFlagged: true 
    });
    const highRiskCount = await messagesCollection.countDocuments({ 
      collectionBatch: 'dashboard_demo',
      riskScore: { $gte: 7 } 
    });
    
    console.log(`📈 Messages created: ${messageCount}`);
    console.log(`🚩 Flagged messages: ${flaggedCount}`);
    console.log(`🔴 High risk messages: ${highRiskCount}`);
    
    console.log('\n🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('\n📋 Now you can:');
    console.log('   1. Refresh your Telegram dashboard');
    console.log('   2. You should see statistics and message data');
    console.log('   3. Try the message filtering and flagging features');
    console.log('\n💡 To collect real data, run: cd scripts && python telegramStats.py');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
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
