#!/usr/bin/env node
/**
 * MongoDB Atlas Connection Test - Production Ready
 * Properly connects to a named database and tests all operations
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

async function main() {
  let connection = null;
  
  try {
    // 1. Get connection URI and ensure we use proper database name
    let mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI not found in server/.env file');
    }
    
    // 2. Check if connecting to default 'test' database - if so, switch to proper name
    if (mongoURI.includes('mongodb+srv://') && !mongoURI.includes('retryWrites=true&w=majority')) {
      // If no database specified, add our database name
      mongoURI = mongoURI.replace('mongodb+srv://', 'mongodb+srv://').replace('/?', '/telegram-dashboard?');
    } else if (mongoURI.includes('/test?') || mongoURI.endsWith('/test')) {
      // Replace 'test' database with proper name
      mongoURI = mongoURI.replace('/test?', '/telegram-dashboard?').replace('/test', '/telegram-dashboard');
    } else if (!mongoURI.includes('/telegram-dashboard')) {
      // Ensure we're using the correct database name
      mongoURI = mongoURI.replace(/\/[^?]*\?/, '/telegram-dashboard?');
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📊 Database: telegram-dashboard`);
    
    // 3. Connect with proper modern settings
    connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📍 Connected to database: ${mongoose.connection.name}`);
    
    // 4. Get direct database and collection references AFTER successful connection
    const db = mongoose.connection.db;
    const collection = db.collection('telegrammessages');
    
    // 5. Start with insertOne() to initialize collection (safer than deleteMany on empty collection)
    console.log('📝 Inserting test document...');
    
    const testDocument = {
      messageId: 'test_connection_msg_001',
      chatId: 'test_chat_001',
      chatName: 'Connection Test Chat',
      chatType: 'group',
      senderId: 'test_user_001',
      senderUsername: 'testuser',
      senderFirstName: 'Test',
      senderLastName: 'User',
      messageText: 'This is a connection test message for MongoDB Atlas',
      messageType: 'text',
      timestamp: new Date(),
      wordCount: 10,
      riskScore: 0,
      collectionBatch: 'connection_test',
      suspiciousKeywords: [],
      isFlagged: false,
      hasMedia: false,
      containsUrls: false,
      containsHashtags: false,
      containsMentions: false,
      views: 0,
      forwards: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const insertResult = await collection.insertOne(testDocument);
    console.log('✅ Insert successful');
    console.log(`📄 Document ID: ${insertResult.insertedId}`);
    
    // 6. Test find operation
    console.log('🔍 Finding test document...');
    const foundDoc = await collection.findOne({ messageId: 'test_connection_msg_001' });
    
    if (foundDoc) {
      console.log('✅ Find successful');
      console.log(`📝 Found message: "${foundDoc.messageText}"`);
    } else {
      throw new Error('Document not found after insert');
    }
    
    // 7. Test count operation
    console.log('📊 Counting test documents...');
    const count = await collection.countDocuments({ collectionBatch: 'connection_test' });
    console.log(`✅ Count successful: ${count} documents`);
    
    // 8. Test update operation
    console.log('📝 Updating test document...');
    const updateResult = await collection.updateOne(
      { messageId: 'test_connection_msg_001' },
      { 
        $set: { 
          riskScore: 1, 
          updatedAt: new Date(),
          testStatus: 'updated'
        } 
      }
    );
    console.log(`✅ Update successful: ${updateResult.modifiedCount} document(s) modified`);
    
    // 9. Test batch insert
    console.log('📦 Testing batch insert...');
    const batchDocs = [];
    for (let i = 2; i <= 5; i++) {
      batchDocs.push({
        messageId: `test_connection_msg_${i.toString().padStart(3, '0')}`,
        chatId: 'test_chat_001',
        chatName: 'Connection Test Chat',
        chatType: 'group',
        senderId: `test_user_${i.toString().padStart(3, '0')}`,
        messageText: `Batch test message ${i}`,
        messageType: 'text',
        timestamp: new Date(),
        wordCount: 4,
        riskScore: 0,
        collectionBatch: 'connection_test',
        suspiciousKeywords: [],
        isFlagged: false,
        hasMedia: false,
        containsUrls: false,
        containsHashtags: false,
        containsMentions: false,
        views: 0,
        forwards: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const batchResult = await collection.insertMany(batchDocs);
    console.log(`✅ Batch insert successful: ${batchResult.insertedCount} documents inserted`);
    
    // 10. Test deleteMany operation (now that collection exists and has data)
    console.log('🗑️ Cleaning up test documents...');
    const deleteResult = await collection.deleteMany({ collectionBatch: 'connection_test' });
    console.log(`✅ Delete successful: ${deleteResult.deletedCount} documents removed`);
    
    // 11. Final verification
    console.log('🔍 Final verification...');
    const finalCount = await collection.countDocuments({ collectionBatch: 'connection_test' });
    
    if (finalCount === 0) {
      console.log('✅ Cleanup verified: All test documents removed');
    } else {
      console.log(`⚠️ Warning: ${finalCount} test documents remain`);
    }
    
    console.log('\n🎉 ALL OPERATIONS SUCCESSFUL!');
    console.log('✅ MongoDB Atlas connection is working perfectly');
    console.log('✅ All CRUD operations (Create, Read, Update, Delete) are functional');
    console.log('✅ Your Telegram message collection system is ready to use');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Start your backend: cd server && npm run dev');
    console.log('   2. Start your frontend: npm start');
    console.log('   3. Collect messages: cd scripts && python telegramStats.py');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    if (error.message.includes('MONGODB_URI')) {
      console.log('💡 Solution: Add MONGODB_URI to your server/.env file');
      console.log('   Format: mongodb+srv://username:password@cluster.mongodb.net/telegram-dashboard?retryWrites=true&w=majority');
    } else if (error.message.includes('serverSelectionTimeoutMS')) {
      console.log('💡 Solution: Check your MongoDB Atlas cluster status');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Solution: Verify username/password in connection string');
    } else if (error.message.includes('buffering')) {
      console.log('💡 Solution: Database operation attempted before connection established');
    } else {
      console.log('💡 Check your MongoDB Atlas cluster and connection string');
    }
    
    process.exit(1);
    
  } finally {
    // 12. Always close connection cleanly
    if (connection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Connection closed');
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error.message);
  process.exit(1);
});

// Handle interrupt signals
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received interrupt signal');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
  }
  process.exit(0);
});

// 13. Run main function with proper error handling
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
