#!/usr/bin/env node
/**
 * Database Setup and Test Script for Telegram Message Collection
 * This script helps diagnose and fix MongoDB connection issues
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../server/.env' });

// Import models
const TelegramMessage = require('../server/models/TelegramMessage');

async function checkMongoConnection() {
  console.log('🔍 Checking MongoDB Connection...\n');
  
  // Try different connection URIs
  const possibleURIs = [
    process.env.MONGODB_URI,
    'mongodb://localhost:27017/telegram_dashboard',
    'mongodb://127.0.0.1:27017/telegram_dashboard',
    'mongodb://localhost:27017/test'
  ];
  
  for (const uri of possibleURIs) {
    if (!uri) continue;
    
    try {
      console.log(`🔗 Trying: ${uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
      
      // Different settings for Atlas vs Local
      const connectionOptions = uri.includes('mongodb+srv') ? {
        // MongoDB Atlas optimized settings
        serverSelectionTimeoutMS: 10000, // 10 seconds for Atlas
        socketTimeoutMS: 60000, // 60 seconds for Atlas operations
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        bufferCommands: true,
        bufferMaxEntries: 0,
        connectTimeoutMS: 30000,
        family: 4
      } : {
        // Local MongoDB settings
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 3000
      };
      
      await mongoose.connect(uri, connectionOptions);
      
      // Test the connection with longer timeout for Atlas
      const pingTimeout = uri.includes('mongodb+srv') ? 15000 : 5000;
      await Promise.race([
        mongoose.connection.db.admin().ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), pingTimeout))
      ]);
      
      console.log('✅ Connection successful!');
      return uri;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      // Disconnect if partially connected
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    }
  }
  
  throw new Error('All MongoDB connection attempts failed');
}

async function checkDatabasePermissions(uri) {
  console.log('\n📋 Checking Database Permissions...');
  
  try {
    // Test basic operations
    const dbName = mongoose.connection.name;
    console.log(`📊 Connected to database: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections`);
    
    // Test write permissions with a simple document
    const testDoc = new TelegramMessage({
      messageId: 'test_connection_check',
      chatId: 'test_chat',
      chatName: 'Test Chat',
      chatType: 'private',
      senderId: 'test_sender',
      messageText: 'Connection test message',
      timestamp: new Date(),
      collectionBatch: 'connection_test'
    });
    
    await testDoc.save();
    console.log('✅ Write permission: OK');
    
    // Test read permissions
    const foundDoc = await TelegramMessage.findOne({ messageId: 'test_connection_check' });
    if (foundDoc) {
      console.log('✅ Read permission: OK');
    }
    
    // Cleanup test document
    await TelegramMessage.deleteOne({ messageId: 'test_connection_check' });
    console.log('✅ Delete permission: OK');
    
    return true;
    
  } catch (error) {
    console.error(`❌ Database permission error: ${error.message}`);
    return false;
  }
}

async function createSimpleTestData() {
  console.log('\n📝 Creating Simple Test Data...');
  
  try {
    // Clear any existing test data first
    await TelegramMessage.deleteMany({ collectionBatch: 'simple_test' });
    
    // Create a single test message
    const testMessage = new TelegramMessage({
      messageId: 'simple_test_msg_1',
      chatId: 'test_chat_123',
      chatName: 'Simple Test Chat',
      chatType: 'group',
      senderId: 'test_user_456',
      senderUsername: 'testuser',
      senderFirstName: 'Test',
      senderLastName: 'User',
      messageText: 'This is a simple test message for database verification',
      messageType: 'text',
      timestamp: new Date(),
      wordCount: 10,
      riskScore: 2,
      collectionBatch: 'simple_test',
      suspiciousKeywords: [],
      isFlagged: false
    });
    
    await testMessage.save();
    console.log('✅ Test message created');
    
    // Verify the message was saved
    const savedMessage = await TelegramMessage.findOne({ messageId: 'simple_test_msg_1' });
    if (savedMessage) {
      console.log('✅ Test message verified in database');
      console.log(`   Message ID: ${savedMessage.messageId}`);
      console.log(`   Chat: ${savedMessage.chatName}`);
      console.log(`   Text: ${savedMessage.messageText.substring(0, 50)}...`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error creating test data: ${error.message}`);
    return false;
  }
}

async function testBasicQueries() {
  console.log('\n🔍 Testing Basic Database Queries...');
  
  try {
    // Count test documents
    const count = await TelegramMessage.countDocuments({ collectionBatch: 'simple_test' });
    console.log(`✅ Document count query: ${count} documents found`);
    
    // Find test documents
    const messages = await TelegramMessage.find({ collectionBatch: 'simple_test' }).limit(5);
    console.log(`✅ Find query: ${messages.length} documents retrieved`);
    
    // Test filtering
    const textMessages = await TelegramMessage.find({ 
      collectionBatch: 'simple_test',
      messageType: 'text' 
    });
    console.log(`✅ Filter query: ${textMessages.length} text messages found`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Query error: ${error.message}`);
    return false;
  }
}

async function generateConnectionReport() {
  console.log('\n📊 Database Connection Report');
  console.log('================================');
  
  const connection = mongoose.connection;
  console.log(`Status: ${connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`Database: ${connection.name}`);
  console.log(`Host: ${connection.host}`);
  console.log(`Port: ${connection.port}`);
  
  // Get collection info
  try {
    const collections = await connection.db.listCollections().toArray();
    console.log(`Collections: ${collections.length}`);
    
    const telegramMessages = collections.find(c => c.name === 'telegrammessages');
    if (telegramMessages) {
      const count = await TelegramMessage.estimatedDocumentCount();
      console.log(`Telegram Messages: ${count} documents`);
    }
    
  } catch (error) {
    console.log(`Collections: Error retrieving (${error.message})`);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    await TelegramMessage.deleteMany({ collectionBatch: 'simple_test' });
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log(`⚠️ Cleanup warning: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 MongoDB Connection and Setup Test\n');
  
  try {
    // Step 1: Check MongoDB connection
    const workingURI = await checkMongoConnection();
    console.log(`\n✅ Successfully connected to: ${workingURI}`);
    
    // Step 2: Check database permissions
    const hasPermissions = await checkDatabasePermissions();
    if (!hasPermissions) {
      throw new Error('Database permissions check failed');
    }
    
    // Step 3: Create simple test data
    const testDataCreated = await createSimpleTestData();
    if (!testDataCreated) {
      throw new Error('Test data creation failed');
    }
    
    // Step 4: Test basic queries
    const queriesWork = await testBasicQueries();
    if (!queriesWork) {
      throw new Error('Basic queries failed');
    }
    
    // Step 5: Generate connection report
    await generateConnectionReport();
    
    // Step 6: Cleanup
    await cleanup();
    
    console.log('\n🎉 All Database Tests Passed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Your MongoDB connection is working properly');
    console.log('   2. You can now run the full test suite:');
    console.log('      cd tests && node test-telegram-message-collection.js');
    console.log('   3. Or start using the message collection system');
    
  } catch (error) {
    console.error(`\n❌ Database Setup Failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('   1. Make sure MongoDB is running:');
    console.log('      - Windows: net start MongoDB');
    console.log('      - macOS/Linux: sudo systemctl start mongod');
    console.log('   2. Check MongoDB status:');
    console.log('      - Open MongoDB Compass');
    console.log('      - Try connecting to mongodb://localhost:27017');
    console.log('   3. Verify server/.env file has correct MONGODB_URI');
    console.log('   4. Check firewall/antivirus blocking port 27017');
    
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Received interrupt signal, cleaning up...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

// Run the setup
main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
