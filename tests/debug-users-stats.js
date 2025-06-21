const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function debugUsersStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Connect directly to the database without using models
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('\n📊 RAW USERS COLLECTION DATA:');
    
    const users = await usersCollection.find({}).toArray();
    console.log(`Total users found: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('_id:', user._id);
      console.log('email:', user.email);
      console.log('name:', user.name);
      console.log('googleId:', user.googleId);
      
      if (user.youtube) {
        console.log('✅ YouTube data exists:');
        console.log('  channel_id:', user.youtube.channel_id);
        console.log('  channel_title:', user.youtube.channel_title);
        console.log('  profile_picture:', user.youtube.profile_picture);
        console.log('  connected_at:', user.youtube.connected_at);
        
        if (user.youtube.stats) {
          console.log('  ✅ Stats object exists:');
          console.log('    viewCount:', user.youtube.stats.viewCount, typeof user.youtube.stats.viewCount);
          console.log('    subscriberCount:', user.youtube.stats.subscriberCount, typeof user.youtube.stats.subscriberCount);
          console.log('    videoCount:', user.youtube.stats.videoCount, typeof user.youtube.stats.videoCount);
          console.log('    commentCount:', user.youtube.stats.commentCount, typeof user.youtube.stats.commentCount);
          console.log('    uniqueAuthors:', user.youtube.stats.uniqueAuthors, typeof user.youtube.stats.uniqueAuthors);
          console.log('    lastUpdated:', user.youtube.stats.lastUpdated);
        } else {
          console.log('  ❌ No stats object');
        }
        
        console.log('  All youtube fields:', Object.keys(user.youtube));
      } else {
        console.log('❌ No YouTube data');
      }
    });

    // Test the aggregation query
    console.log('\n🔍 TESTING AGGREGATION:');
    const usersWithStats = await usersCollection.find({ 'youtube.stats': { $exists: true } }).toArray();
    console.log(`Users with youtube.stats: ${usersWithStats.length}`);
    
    let totalViews = 0;
    let totalSubscribers = 0; 
    let totalVideos = 0;
    
    usersWithStats.forEach(user => {
      console.log(`\nProcessing user: ${user.email}`);
      if (user.youtube && user.youtube.stats) {
        const views = user.youtube.stats.viewCount || 0;
        const subs = user.youtube.stats.subscriberCount || 0;
        const videos = user.youtube.stats.videoCount || 0;
        
        console.log(`  Views: ${views}, Subscribers: ${subs}, Videos: ${videos}`);
        
        totalViews += views;
        totalSubscribers += subs;
        totalVideos += videos;
      }
    });
    
    console.log('\n📈 AGGREGATION RESULTS:');
    console.log(`Total Views: ${totalViews}`);
    console.log(`Total Subscribers: ${totalSubscribers}`);
    console.log(`Total Videos: ${totalVideos}`);

    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugUsersStats();
