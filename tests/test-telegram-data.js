const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'dashboard-internship';
const COLLECTION_NAME = 'telegramstats';

const telegramData = {
        totalGroups: 15,
        activeUsers: 245,
        totalUsers: 580,
        totalMessages: 12500,
        totalMediaFiles: 3200,
        messageRate: 150,
        rateChange: 12.5,
        groupPropagation: 67.8,
        avgViewsPerMessage: 42,
        mostActiveUsers: [
          { userId: 'user1', username: 'john_doe', firstName: 'John', lastName: 'Doe', messageCount: 850 },
          { userId: 'user2', username: 'jane_smith', firstName: 'Jane', lastName: 'Smith', messageCount: 720 },
          { userId: 'user3', username: 'mike_wilson', firstName: 'Mike', lastName: 'Wilson', messageCount: 650 },
          { userId: 'user4', username: 'sarah_jones', firstName: 'Sarah', lastName: 'Jones', messageCount: 580 },
          { userId: 'user5', username: 'alex_brown', firstName: 'Alex', lastName: 'Brown', messageCount: 520 }
        ],
        mostActiveGroups: [
          { groupId: 'group1', title: 'Tech Discussions', messageCount: 3200, memberCount: 150, isChannel: false },
          { groupId: 'group2', title: 'Project Updates', messageCount: 2800, memberCount: 85, isChannel: false },
          { groupId: 'group3', title: 'General Chat', messageCount: 2400, memberCount: 220, isChannel: false },
          { groupId: 'group4', title: 'News Channel', messageCount: 1900, memberCount: 450, isChannel: true },
          { groupId: 'group5', title: 'Support Group', messageCount: 1600, memberCount: 95, isChannel: false }
        ],
        topUsersByGroups: [
          { userId: 'user1', username: 'john_doe', firstName: 'John', lastName: 'Doe', groupsJoined: 8 },
          { userId: 'user2', username: 'jane_smith', firstName: 'Jane', lastName: 'Smith', groupsJoined: 7 },
          { userId: 'user3', username: 'mike_wilson', firstName: 'Mike', lastName: 'Wilson', groupsJoined: 6 }
        ],
        
        // Law Enforcement Analytics Data
        mostActiveUserLast7Days: {
          userId: 'user1',
          username: 'john_doe',
          messageCount: 127
        },
        avgMessagesPerDay: 178.5,
        peakHourOfActivity: 15, // 3 PM
        messageGrowthLast7Days: 23.7,
        totalSuspiciousUsers: 3,
        
        suspiciousUsers: [
          {
            userId: 'sus_001',
            username: 'crypto_scammer',
            firstName: 'Suspicious User 1',
            messageCount: 67,
            keywordsMatched: ['usdt', 'investment', 'guaranteed', 'otp'],
            lastActive: new Date().toISOString(),
            groupsActive: ['group1', 'group2'],
            riskScore: 9
          },
          {
            userId: 'sus_002',
            username: 'fraud_account',
            firstName: 'Suspicious User 2',
            messageCount: 45,
            keywordsMatched: ['bitcoin', 'fraud', 'money', 'urgent'],
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            groupsActive: ['group3'],
            riskScore: 8
          },
          {
            userId: 'sus_003',
            username: 'fake_advisor',
            firstName: 'Suspicious User 3',
            messageCount: 32,
            keywordsMatched: ['crypto', 'verify', 'confirm'],
            lastActive: new Date(Date.now() - 7200000).toISOString(),
            groupsActive: ['group1', 'group4'],
            riskScore: 6
          }
        ],
        
        topUserLocations: [
          { locationName: 'English Speaking', userCount: 180, coordinates: null },
          { locationName: 'India', userCount: 95, coordinates: { lat: 28.6139, lng: 77.2090 } },
          { locationName: 'Russia', userCount: 75, coordinates: { lat: 55.7558, lng: 37.6173 } },
          { locationName: 'Nigeria', userCount: 45, coordinates: { lat: 9.0579, lng: 7.4951 } },
          { locationName: 'Germany', userCount: 32, coordinates: { lat: 52.5200, lng: 13.4050 } }
        ],
        
        keywordCloud: [
          { keyword: 'usdt', frequency: 67, riskLevel: 'high' },
          { keyword: 'otp', frequency: 54, riskLevel: 'high' },
          { keyword: 'investment', frequency: 89, riskLevel: 'medium' },
          { keyword: 'crypto', frequency: 156, riskLevel: 'medium' },
          { keyword: 'bitcoin', frequency: 134, riskLevel: 'medium' },
          { keyword: 'fraud', frequency: 23, riskLevel: 'high' },
          { keyword: 'money', frequency: 234, riskLevel: 'low' },
          { keyword: 'guaranteed', frequency: 45, riskLevel: 'medium' },
          { keyword: 'trading', frequency: 198, riskLevel: 'low' }
        ],
        timestamp: new Date(),
        dataSource: 'test-data',
        collectionPeriod: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          end: new Date()
        }
      });
      
      await sampleStats.save();
      console.log('✅ Sample Telegram data created successfully!');
      console.log('\n🎯 Law Enforcement Analytics Data Created:');
      console.log(`   🚨 Suspicious Users: 3 flagged users with risk scores 6-9/10`);
      console.log(`   📊 Enhanced Metrics: Peak hour 3PM, Growth +23.7%`);
      console.log(`   🌍 Location Intelligence: 5 geographic regions`);
      console.log(`   🔍 Keyword Analysis: 9 tracked terms with risk levels`);
      console.log('\n📱 Refresh your Telegram Dashboard to see all the analytics!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testTelegramData();
