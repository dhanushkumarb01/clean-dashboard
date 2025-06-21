const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkSpecificUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Connect directly to the database without using models
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('\n📊 SPECIFIC USER DATA:');
    
    // Find the specific user
    const user = await usersCollection.findOne({ email: 'dhanush.23cse@gmail.com' });
    
    if (user) {
      console.log('✅ Found user:', user.email);
      console.log('📋 Full user document:');
      console.log(JSON.stringify(user, null, 2));
      
      if (user.youtube) {
        console.log('\n🎯 YouTube data structure:');
        console.log('Keys in youtube object:', Object.keys(user.youtube));
        
        // Check every field in youtube object
        Object.keys(user.youtube).forEach(key => {
          const value = user.youtube[key];
          console.log(`  ${key}: ${value} (type: ${typeof value})`);
          
          // If it's an object, show its keys
          if (typeof value === 'object' && value !== null) {
            console.log(`    Keys in ${key}:`, Object.keys(value));
          }
        });
        
        // Look for numeric values that might be our stats
        console.log('\n🔢 Looking for numeric values:');
        Object.keys(user.youtube).forEach(key => {
          const value = user.youtube[key];
          if (typeof value === 'number') {
            console.log(`  FOUND NUMBER: ${key} = ${value}`);
          }
          // Check inside nested objects
          if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach(nestedKey => {
              const nestedValue = value[nestedKey];
              if (typeof nestedValue === 'number') {
                console.log(`  FOUND NUMBER: ${key}.${nestedKey} = ${nestedValue}`);
              }
            });
          }
        });
      }
    } else {
      console.log('❌ User not found with email: dhanush.23cse@gmail.com');
    }

    console.log('\n✅ Specific user check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkSpecificUser();
