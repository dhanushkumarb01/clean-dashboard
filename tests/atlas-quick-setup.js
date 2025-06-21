#!/usr/bin/env node
/**
 * MongoDB Atlas Quick Setup Script for Telegram Message Collection
 * Specifically optimized for MongoDB Atlas connection issues
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

// Import models
const TelegramMessage = require('../server/models/TelegramMessage');

async function connectToAtlas() {
  console.log('🚀 MongoDB Atlas Quick Setup for Telegram Messages\n');
  
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI || !mongoURI.includes('mongodb+srv')) {
    console.error('❌ MONGODB_URI not found or not an Atlas connection string');
    console.log('💡 Expected format: mongodb+srv://username:password@cluster.xxx.mongodb.net/database');
    process.exit(1);
  }
  
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Atlas-optimized connection settings
    const atlasOptions = {
      serverSelectionTimeoutMS: 20000, // 20 seconds
      socketTimeoutMS: 120000, // 2 minutes for operations
      connectTimeoutMS: 20000, // 20 seconds to establish connection
      maxPoolSize: 5, // Smaller pool for Atlas
      minPoolSize: 1,
      maxIdleTimeMS: 60000, // 1 minute idle timeout
      bufferCommands: true, // Enable buffering for Atlas
      retryWrites: true, // Enable retry writes
      w: 'majority', // Write concern
      family: 4 // IPv4 only
    };
    
    await mongoose.connect(mongoURI, atlasOptions);
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    // Test connection with extended timeout
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Atlas ping timeout after 20 seconds')), 20000)
      )
    ]);
    console.log('✅ Atlas connection verified');
    
    return true;
    
  } catch (error) {
    console.error('❌ Atlas connection failed:', error.message);
    console.log('\n🔧 Atlas-specific troubleshooting:');
    console.log('   1. Check your IP address is whitelisted in Atlas');
    console.log('   2. Verify username/password in connection string');
    console.log('   3. Ensure cluster is not paused/sleeping');
    console.log('   4. Try from MongoDB Compass first');
    return false;
  }
}

async function createTestMessageWithRetry() {
  console.log('\n📝 Creating test message with Atlas retry logic...');
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`   Attempt ${attempt}/${maxRetries}`);
      
      // Clear any existing test data
      await TelegramMessage.deleteMany({ 
        collectionBatch: 'atlas_test' 
      }).maxTimeMS(30000); // 30 second timeout
      
      // Create test message
      const testMessage = new TelegramMessage({
        messageId: 'atlas_test_msg_1',
        chatId: 'atlas_test_chat',
        chatName: 'Atlas Test Chat',
        chatType: 'group',
        senderId: 'atlas_test_user',
        senderUsername: 'atlastestuser',
        senderFirstName: 'Atlas',
        senderLastName: 'User',
        messageText: 'This is a test message for MongoDB Atlas verification',
        messageType: 'text',
        timestamp: new Date(),
        wordCount: 10,
        riskScore: 1,
        collectionBatch: 'atlas_test',
        suspiciousKeywords: [],
        isFlagged: false
      });
      
      // Save with timeout
      await testMessage.save({ maxTimeMS: 30000 });
      console.log('   ✅ Test message created successfully');
      
      // Verify the save
      const saved = await TelegramMessage.findOne({ 
        messageId: 'atlas_test_msg_1' 
      }).maxTimeMS(15000);
      
      if (saved) {
        console.log('   ✅ Test message verified in Atlas');
        console.log(`   📝 Message: ${saved.messageText.substring(0, 40)}...`);
        return true;
      } else {
        throw new Error('Message not found after save');
      }
      
    } catch (error) {
      console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`   ⏳ Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  console.log('   ❌ All attempts failed');
  return false;
}

async function testAtlasQueries() {
  console.log('\n🔍 Testing Atlas database queries...');
  
  try {
    // Test with timeout settings
    const queryOptions = { maxTimeMS: 15000 };
    
    // Count documents
    const count = await TelegramMessage.countDocuments(
      { collectionBatch: 'atlas_test' },
      queryOptions
    );
    console.log(`   ✅ Count query: ${count} documents`);
    
    // Find documents
    const messages = await TelegramMessage.find(
      { collectionBatch: 'atlas_test' },
      null,
      { ...queryOptions, limit: 5 }
    );
    console.log(`   ✅ Find query: ${messages.length} documents retrieved`);
    
    // Update test
    const updateResult = await TelegramMessage.updateOne(
      { messageId: 'atlas_test_msg_1' },
      { $set: { riskScore: 2 } },
      { ...queryOptions }
    );
    console.log(`   ✅ Update query: ${updateResult.modifiedCount} documents modified`);
    
    return true;
    
  } catch (error) {
    console.error(`   ❌ Query error: ${error.message}`);
    return false;
  }
}

async function testBatchOperations() {
  console.log('\n📦 Testing batch operations for message collection...');
  
  try {
    // Simulate batch message insertion like the Python script
    const batchMessages = [];
    for (let i = 1; i <= 10; i++) {
      batchMessages.push({
        messageId: `atlas_batch_msg_${i}`,
        chatId: 'atlas_batch_chat',
        chatName: 'Atlas Batch Test Chat',
        chatType: 'group',
        senderId: `atlas_user_${i}`,
        messageText: `Batch test message ${i}`,
        messageType: 'text',
        timestamp: new Date(),
        wordCount: 4,
        riskScore: 0,
        collectionBatch: 'atlas_batch_test',
        suspiciousKeywords: [],
        isFlagged: false
      });
    }
    
    // Insert batch with timeout
    const result = await TelegramMessage.insertMany(batchMessages, {
      maxTimeMS: 30000,
      ordered: false // Continue on errors
    });
    
    console.log(`   ✅ Batch insert: ${result.length} messages created`);
    
    // Verify batch
    const batchCount = await TelegramMessage.countDocuments({
      collectionBatch: 'atlas_batch_test'
    }).maxTimeMS(15000);
    
    console.log(`   ✅ Batch verification: ${batchCount} messages found`);
    
    return true;
    
  } catch (error) {
    console.error(`   ❌ Batch operation error: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up Atlas test data...');
  
  try {
    await TelegramMessage.deleteMany({
      $or: [
        { collectionBatch: 'atlas_test' },
        { collectionBatch: 'atlas_batch_test' }
      ]
    }).maxTimeMS(30000);
    
    console.log('   ✅ Test data cleaned up successfully');
    
  } catch (error) {
    console.log(`   ⚠️ Cleanup warning: ${error.message}`);
  }
}

async function generateAtlasReport() {
  console.log('\n📊 MongoDB Atlas Connection Report');
  console.log('=====================================');
  
  const connection = mongoose.connection;
  console.log(`Status: ${connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`Database: ${connection.name}`);
  console.log(`Cluster: ${connection.host}`);
  
  try {
    // Get database stats
    const dbStats = await connection.db.stats({ maxTimeMS: 15000 });
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Check telegram messages collection
    const telegramCount = await TelegramMessage.estimatedDocumentCount()
      .maxTimeMS(10000);
    console.log(`Telegram Messages: ${telegramCount} documents`);
    
  } catch (error) {
    console.log(`Stats: Unable to retrieve (${error.message})`);
  }
}

async function main() {
  try {
    // Step 1: Connect to Atlas
    const connected = await connectToAtlas();
    if (!connected) {
      process.exit(1);
    }
    
    // Step 2: Test message creation
    const messageCreated = await createTestMessageWithRetry();
    if (!messageCreated) {
      console.log('\n⚠️ Message creation failed, but continuing with other tests...');
    }
    
    // Step 3: Test queries
    const queriesWork = await testAtlasQueries();
    if (!queriesWork) {
      console.log('\n⚠️ Some queries failed, check Atlas configuration');
    }
    
    // Step 4: Test batch operations
    const batchWorks = await testBatchOperations();
    if (!batchWorks) {
      console.log('\n⚠️ Batch operations failed, may need optimization');
    }
    
    // Step 5: Generate report
    await generateAtlasReport();
    
    // Step 6: Cleanup
    await cleanup();
    
    console.log('\n🎉 MongoDB Atlas Setup Complete!');
    
    if (messageCreated && queriesWork && batchWorks) {
      console.log('\n✅ ALL TESTS PASSED - Atlas is ready for Telegram message collection');
      console.log('\n📋 Next Steps:');
      console.log('   1. Run: cd tests && node test-telegram-message-collection.js');
      console.log('   2. Start backend: cd server && npm run dev');
      console.log('   3. Start frontend: npm start');
      console.log('   4. Collect messages: cd scripts && python telegramStats.py');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - Check Atlas configuration');
      console.log('\n🔧 Recommendations:');
      console.log('   1. Verify IP whitelist in Atlas dashboard');
      console.log('   2. Check cluster is not paused');
      console.log('   3. Ensure sufficient Atlas tier (M0+ recommended)');
      console.log('   4. Try connecting with MongoDB Compass first');
    }
    
  } catch (error) {
    console.error(`\n❌ Atlas setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB Atlas');
    }
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Received interrupt signal, disconnecting...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the Atlas setup
main().catch(error => {
  console.error('❌ Atlas setup failed:', error.message);
  process.exit(1);
});
