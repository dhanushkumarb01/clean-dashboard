const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import models
const Comment = require('./backend/models/Comment');
const Video = require('./backend/models/Video');
const Channel = require('./backend/models/Channel');
const User = require('./backend/models/User');

async function checkDatabaseData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check what's in each collection
    console.log('\n📊 DATABASE CONTENT ANALYSIS:');
    
    // 1. Check Comments collection
    const totalComments = await Comment.countDocuments();
    console.log('\n💬 COMMENTS COLLECTION:');
    console.log(`Total comments: ${totalComments}`);
    
    if (totalComments > 0) {
      const sampleComment = await Comment.findOne();
      console.log('Sample comment structure:', {
        videoId: sampleComment.videoId,
        authorDisplayName: sampleComment.authorDisplayName,
        authorChannelId: sampleComment.authorChannelId,
        channelId: sampleComment.channelId,
        userId: sampleComment.userId,
        publishedAt: sampleComment.publishedAt
      });
      
      // Check unique authors
      const uniqueAuthors = await Comment.distinct('authorChannelId');
      console.log(`Unique authors: ${uniqueAuthors.length}`);
      
      // Check comments by userId
      const commentsByUser = await Comment.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('Comments by userId:', commentsByUser);
    }

    // 2. Check Videos collection
    const totalVideos = await Video.countDocuments();
    console.log('\n🎥 VIDEOS COLLECTION:');
    console.log(`Total videos: ${totalVideos}`);
    
    if (totalVideos > 0) {
      const sampleVideo = await Video.findOne();
      console.log('Sample video structure:', {
        videoId: sampleVideo.videoId,
        channelId: sampleVideo.channelId,
        title: sampleVideo.title,
        publishedAt: sampleVideo.publishedAt
      });
      
      // Check videos by channelId
      const videosByChannel = await Video.aggregate([
        { $group: { _id: '$channelId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('Videos by channelId:', videosByChannel);
    }

    // 3. Check Channels collection
    const totalChannels = await Channel.countDocuments();
    console.log('\n📺 CHANNELS COLLECTION:');
    console.log(`Total channels: ${totalChannels}`);
    
    if (totalChannels > 0) {
      const sampleChannel = await Channel.findOne();
      console.log('Sample channel structure:', {
        channelId: sampleChannel.channelId,
        title: sampleChannel.title,
        owner: sampleChannel.owner,
        stats: sampleChannel.stats
      });
      
      // Check channels by owner
      const channelsByOwner = await Channel.aggregate([
        { $group: { _id: '$owner', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('Channels by owner:', channelsByOwner);
    }

    // 4. Check Users collection
    const totalUsers = await User.countDocuments();
    console.log('\n👤 USERS COLLECTION:');
    console.log(`Total users: ${totalUsers}`);
    
    if (totalUsers > 0) {
      const users = await User.find({}, { email: 1, googleId: 1, 'youtube.channel_id': 1, 'youtube.channel_title': 1 });
      console.log('Users with YouTube connections:');
      users.forEach(user => {
        console.log(`- ${user.email} (googleId: ${user.googleId}) -> Channel: ${user.youtube?.channel_id} (${user.youtube?.channel_title})`);
      });
    }

    // 5. Cross-reference data
    console.log('\n🔍 CROSS-REFERENCE ANALYSIS:');
    
    // Find which users have data in other collections
    if (totalUsers > 0 && totalComments > 0) {
      const usersWithComments = await Comment.distinct('userId');
      console.log('User IDs that have comments:', usersWithComments);
      
      for (let userId of usersWithComments) {
        const userCommentCount = await Comment.countDocuments({ userId });
        const uniqueAuthorsForUser = await Comment.distinct('authorChannelId', { userId });
        console.log(`User ${userId}: ${userCommentCount} comments, ${uniqueAuthorsForUser.length} unique authors`);
      }
    }

    console.log('\n✅ Database analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkDatabaseData();
