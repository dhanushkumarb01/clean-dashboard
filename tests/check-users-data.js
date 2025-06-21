const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import User model
const User = require('./backend/models/User');

async function checkUsersData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check what's in the users collection
    console.log('\n📊 USERS COLLECTION ANALYSIS:');
    
    const totalUsers = await User.countDocuments();
    console.log(`Total users: ${totalUsers}`);
    
    if (totalUsers > 0) {
      // Get all users and show their structure
      const users = await User.find({});
      
      console.log('\n🔍 User Documents Structure:');
      users.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('Google ID:', user.googleId);
        
        if (user.youtube) {
          console.log('YouTube Data Found:');
          console.log('  Channel ID:', user.youtube.channel_id);
          console.log('  Channel Title:', user.youtube.channel_title);
          console.log('  Profile Picture:', user.youtube.profile_picture);
          console.log('  Connected At:', user.youtube.connected_at);
          
          if (user.youtube.stats) {
            console.log('  Stats:');
            console.log('    View Count:', user.youtube.stats.viewCount);
            console.log('    Subscriber Count:', user.youtube.stats.subscriberCount);
            console.log('    Video Count:', user.youtube.stats.videoCount);
            console.log('    Comment Count:', user.youtube.stats.commentCount);
            console.log('    Unique Authors:', user.youtube.stats.uniqueAuthors);
            console.log('    Last Updated:', user.youtube.stats.lastUpdated);
          } else {
            console.log('  No stats object found');
          }
          
          // Check for any other fields in youtube object
          console.log('  All YouTube fields:', Object.keys(user.youtube));
        } else {
          console.log('No YouTube data');
        }
        
        console.log('Full user object keys:', Object.keys(user.toObject()));
      });
    }

    console.log('\n✅ Users analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkUsersData();
