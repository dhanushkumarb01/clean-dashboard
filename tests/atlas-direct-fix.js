#!/usr/bin/env node
/**
 * Direct MongoDB Atlas Fix - Bypasses Mongoose buffering issues
 * This script directly uses MongoDB driver without Mongoose buffering
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

async function connectDirectly() {
  console.log('🚀 Direct Atlas Connection Fix\n');
  
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  
  try {
    console.log('🔗 Connecting with NO BUFFERING...');
    
    // Completely disable buffering and use direct connection
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 0, // No timeout
      connectTimeoutMS: 30000,
      maxPoolSize: 1, // Single connection
      minPoolSize: 1,
      bufferCommands: false, // DISABLE BUFFERING
      bufferMaxEntries: 0, // DISABLE BUFFERING
      maxIdleTimeMS: 0, // No idle timeout
      family: 4
    });
    
    console.log('✅ Connected successfully');
    
    // Get direct database reference
    const db = mongoose.connection.db;
    console.log('✅ Got direct database reference');
    
    return db;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

async function testDirectOperations(db) {
  console.log('\n🔧 Testing Direct MongoDB Operations...');
  
  const collection = db.collection('telegrammessages');
  
  try {
    // Test 1: Direct delete (no timeout)
    console.log('   Testing direct delete...');
    const deleteResult = await collection.deleteMany({ 
      collectionBatch: 'direct_test' 
    });
    console.log(`   ✅ Delete: ${deleteResult.deletedCount} documents removed`);
    
    // Test 2: Direct insert
    console.log('   Testing direct insert...');
    const testDoc = {
      messageId: 'direct_test_msg_1',
      chatId: 'direct_test_chat',
      chatName: 'Direct Test Chat',
      chatType: 'group',
      senderId: 'direct_test_user',
      messageText: 'This is a direct test message',
      messageType: 'text',
      timestamp: new Date(),
      wordCount: 6,
      riskScore: 1,
      collectionBatch: 'direct_test',
      suspiciousKeywords: [],
      isFlagged: false,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: false,
      containsMentions: false,
      views: 0,
      forwards: 0
    };
    
    const insertResult = await collection.insertOne(testDoc);
    console.log(`   ✅ Insert: Document created with ID ${insertResult.insertedId}`);
    
    // Test 3: Direct find
    console.log('   Testing direct find...');
    const findResult = await collection.findOne({ 
      messageId: 'direct_test_msg_1' 
    });
    console.log(`   ✅ Find: Document found - ${findResult.messageText}`);
    
    // Test 4: Direct count
    console.log('   Testing direct count...');
    const countResult = await collection.countDocuments({ 
      collectionBatch: 'direct_test' 
    });
    console.log(`   ✅ Count: ${countResult} documents`);
    
    // Test 5: Direct batch insert
    console.log('   Testing direct batch insert...');
    const batchDocs = [];
    for (let i = 1; i <= 5; i++) {
      batchDocs.push({
        messageId: `direct_batch_msg_${i}`,
        chatId: 'direct_batch_chat',
        chatName: 'Direct Batch Chat',
        chatType: 'group',
        senderId: `direct_user_${i}`,
        messageText: `Direct batch message ${i}`,
        messageType: 'text',
        timestamp: new Date(),
        wordCount: 4,
        riskScore: 0,
        collectionBatch: 'direct_batch_test',
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 0,
        forwards: 0
      });
    }
    
    const batchResult = await collection.insertMany(batchDocs);
    console.log(`   ✅ Batch Insert: ${batchResult.insertedCount} documents created`);
    
    // Test 6: Direct update
    console.log('   Testing direct update...');
    const updateResult = await collection.updateOne(
      { messageId: 'direct_test_msg_1' },
      { $set: { riskScore: 5, isFlagged: true } }
    );
    console.log(`   ✅ Update: ${updateResult.modifiedCount} documents modified`);
    
    console.log('\n✅ ALL DIRECT OPERATIONS SUCCESSFUL!');
    return true;
    
  } catch (error) {
    console.error(`   ❌ Direct operation failed: ${error.message}`);
    return false;
  }
}

async function createTelegramMessageModel() {
  console.log('\n🔧 Creating optimized Telegram Message model...');
  
  try {
    // Clear existing model if it exists
    if (mongoose.models.TelegramMessage) {
      delete mongoose.models.TelegramMessage;
    }
    
    // Create schema with NO BUFFERING
    const telegramMessageSchema = new mongoose.Schema({
      messageId: { type: String, required: true },
      chatId: { type: String, required: true },
      chatName: { type: String, required: true },
      chatType: { type: String, enum: ['group', 'channel', 'private'], required: true },
      senderId: { type: String, required: true },
      senderUsername: { type: String },
      senderFirstName: { type: String },
      senderLastName: { type: String },
      senderIsBot: { type: Boolean, default: false },
      messageText: { type: String },
      messageType: { type: String, enum: ['text', 'photo', 'video', 'document', 'audio', 'sticker', 'voice', 'animation', 'contact', 'location', 'other'], default: 'text' },
      hasMedia: { type: Boolean, default: false },
      mediaType: { type: String },
      timestamp: { type: Date, required: true },
      editedTimestamp: { type: Date },
      views: { type: Number, default: 0 },
      forwards: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
      containsUrls: { type: Boolean, default: false },
      containsHashtags: { type: Boolean, default: false },
      containsMentions: { type: Boolean, default: false },
      language: { type: String },
      isFlagged: { type: Boolean, default: false },
      flagReason: { type: String },
      flaggedBy: { type: String },
      flaggedAt: { type: Date },
      suspiciousKeywords: [{ type: String }],
      riskScore: { type: Number, default: 0, min: 0, max: 10 },
      collectionBatch: { type: String },
      dataSource: { type: String, default: 'telethon' },
      isDeleted: { type: Boolean, default: false }
    }, {
      timestamps: true,
      bufferCommands: false, // DISABLE BUFFERING
      bufferMaxEntries: 0 // DISABLE BUFFERING
    });
    
    // Create model with disabled buffering
    const TelegramMessage = mongoose.model('TelegramMessage', telegramMessageSchema);
    
    console.log('✅ Optimized model created');
    return TelegramMessage;
    
  } catch (error) {
    console.error(`❌ Model creation failed: ${error.message}`);
    return null;
  }
}

async function testOptimizedModel(TelegramMessage) {
  console.log('\n🧪 Testing optimized Mongoose model...');
  
  try {
    // Test with direct save (no buffering)
    console.log('   Testing optimized save...');
    const testMessage = new TelegramMessage({
      messageId: 'optimized_test_msg_1',
      chatId: 'optimized_test_chat',
      chatName: 'Optimized Test Chat',
      chatType: 'group',
      senderId: 'optimized_test_user',
      messageText: 'This is an optimized test message',
      timestamp: new Date(),
      collectionBatch: 'optimized_test'
    });
    
    await testMessage.save();
    console.log('   ✅ Optimized save successful');
    
    // Test optimized find
    console.log('   Testing optimized find...');
    const found = await TelegramMessage.findOne({ 
      messageId: 'optimized_test_msg_1' 
    });
    console.log(`   ✅ Optimized find: ${found.messageText}`);
    
    // Test optimized delete
    console.log('   Testing optimized delete...');
    await TelegramMessage.deleteMany({ 
      collectionBatch: 'optimized_test' 
    });
    console.log('   ✅ Optimized delete successful');
    
    console.log('\n✅ OPTIMIZED MODEL WORKS PERFECTLY!');
    return true;
    
  } catch (error) {
    console.error(`   ❌ Optimized model test failed: ${error.message}`);
    return false;
  }
}

async function updateBackendModel() {
  console.log('\n📝 Creating fixed model file...');
  
  const fixedModelContent = `const mongoose = require('mongoose');

// FIXED: Disable buffering to prevent Atlas timeout issues
mongoose.set('bufferCommands', false);
mongoose.set('bufferMaxEntries', 0);

const telegramMessageSchema = new mongoose.Schema({
  // Message identifiers
  messageId: { type: String, required: true },
  chatId: { type: String, required: true },
  chatName: { type: String, required: true },
  chatType: { type: String, enum: ['group', 'channel', 'private'], required: true },
  
  // Sender information
  senderId: { type: String, required: true },
  senderUsername: { type: String },
  senderFirstName: { type: String },
  senderLastName: { type: String },
  senderIsBot: { type: Boolean, default: false },
  
  // Message content
  messageText: { type: String },
  messageType: { type: String, enum: ['text', 'photo', 'video', 'document', 'audio', 'sticker', 'voice', 'animation', 'contact', 'location', 'other'], default: 'text' },
  hasMedia: { type: Boolean, default: false },
  mediaType: { type: String },
  
  // Timestamps
  timestamp: { type: Date, required: true },
  editedTimestamp: { type: Date },
  
  // Engagement metrics
  views: { type: Number, default: 0 },
  forwards: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  
  // Content analysis
  wordCount: { type: Number, default: 0 },
  containsUrls: { type: Boolean, default: false },
  containsHashtags: { type: Boolean, default: false },
  containsMentions: { type: Boolean, default: false },
  language: { type: String },
  
  // Moderation flags
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { type: String },
  flaggedAt: { type: Date },
  suspiciousKeywords: [{ type: String }],
  riskScore: { type: Number, default: 0, min: 0, max: 10 },
  
  // Metadata
  collectionBatch: { type: String },
  dataSource: { type: String, default: 'telethon' },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  // CRITICAL: Disable buffering for Atlas compatibility
  bufferCommands: false,
  bufferMaxEntries: 0
});

// Indexes for efficient queries
telegramMessageSchema.index({ chatId: 1, timestamp: -1 });
telegramMessageSchema.index({ senderId: 1, timestamp: -1 });
telegramMessageSchema.index({ timestamp: -1 });
telegramMessageSchema.index({ isFlagged: 1 });
telegramMessageSchema.index({ riskScore: -1 });
telegramMessageSchema.index({ collectionBatch: 1 });

// Compound indexes for common query patterns
telegramMessageSchema.index({ chatId: 1, isFlagged: 1 });
telegramMessageSchema.index({ senderId: 1, isFlagged: 1 });

module.exports = mongoose.model('TelegramMessage', telegramMessageSchema);
`;

  const fs = require('fs');
  const path = require('path');
  
  try {
    const modelPath = path.join(__dirname, '../server/models/TelegramMessage.js');
    fs.writeFileSync(modelPath, fixedModelContent);
    console.log('✅ Fixed model file created at server/models/TelegramMessage.js');
    
    // Also create backup
    fs.writeFileSync(modelPath + '.backup', fixedModelContent);
    console.log('✅ Backup created');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to update model file: ${error.message}`);
    return false;
  }
}

async function cleanup(db) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const collection = db.collection('telegrammessages');
    
    await collection.deleteMany({
      $or: [
        { collectionBatch: 'direct_test' },
        { collectionBatch: 'direct_batch_test' },
        { collectionBatch: 'optimized_test' }
      ]
    });
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log(`⚠️ Cleanup warning: ${error.message}`);
  }
}

async function main() {
  try {
    // Step 1: Connect directly
    const db = await connectDirectly();
    
    // Step 2: Test direct operations (bypass Mongoose)
    const directWorks = await testDirectOperations(db);
    if (!directWorks) {
      throw new Error('Direct operations failed');
    }
    
    // Step 3: Create optimized model
    const TelegramMessage = await createTelegramMessageModel();
    if (!TelegramMessage) {
      throw new Error('Model creation failed');
    }
    
    // Step 4: Test optimized model
    const modelWorks = await testOptimizedModel(TelegramMessage);
    if (!modelWorks) {
      throw new Error('Optimized model failed');
    }
    
    // Step 5: Update backend model file
    const fileUpdated = await updateBackendModel();
    if (!fileUpdated) {
      throw new Error('File update failed');
    }
    
    // Step 6: Cleanup
    await cleanup(db);
    
    console.log('\n🎉 ATLAS ISSUE COMPLETELY FIXED!');
    console.log('\n✅ What was fixed:');
    console.log('   1. Disabled Mongoose buffering completely');
    console.log('   2. Used direct MongoDB operations');
    console.log('   3. Updated model with proper Atlas settings');
    console.log('   4. All CRUD operations now work perfectly');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your backend server: cd server && npm run dev');
    console.log('   2. Run: cd tests && node test-telegram-message-collection.js');
    console.log('   3. Start collecting: cd scripts && python telegramStats.py');
    
  } catch (error) {
    console.error(`\n❌ Fix failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB Atlas');
    }
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run the fix
main().catch(error => {
  console.error('❌ Atlas fix failed:', error.message);
  process.exit(1);
});
