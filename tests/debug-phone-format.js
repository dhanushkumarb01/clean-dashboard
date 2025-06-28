const mongoose = require('mongoose');
require('dotenv').config({ path: './config/server.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TelegramStats = require('../server/models/TelegramStats');

async function debugPhoneFormat() {
  try {
    console.log('🔍 Debugging phone number format issue...\n');
    
    // Check what's in the database
    const allStats = await TelegramStats.find({}).sort({ timestamp: -1 }).limit(5);
    
    console.log('📊 Database entries found:', allStats.length);
    allStats.forEach((stat, index) => {
      console.log(`\n${index + 1}. Phone: "${stat.phone}"`);
      console.log(`   Total Groups: ${stat.totalGroups}`);
      console.log(`   Total Messages: ${stat.totalMessages}`);
      console.log(`   Most Active Users: ${stat.mostActiveUsers?.length || 0}`);
      console.log(`   Most Active Groups: ${stat.mostActiveGroups?.length || 0}`);
      console.log(`   Timestamp: ${stat.timestamp}`);
    });
    
    // Test different phone formats
    const testPhone = '+917989213019';
    const testPhoneWithoutPlus = '917989213019';
    const testPhoneWithPlus = '+917989213019';
    
    console.log('\n🔍 Testing different phone formats:');
    
    // Test exact match
    const exactMatch = await TelegramStats.findOne({ phone: testPhone });
    console.log(`\nExact match "${testPhone}":`, exactMatch ? 'FOUND' : 'NOT FOUND');
    
    // Test without plus
    const withoutPlus = await TelegramStats.findOne({ phone: testPhoneWithoutPlus });
    console.log(`Without plus "${testPhoneWithoutPlus}":`, withoutPlus ? 'FOUND' : 'NOT FOUND');
    
    // Test with plus
    const withPlus = await TelegramStats.findOne({ phone: testPhoneWithPlus });
    console.log(`With plus "${testPhoneWithPlus}":`, withPlus ? 'FOUND' : 'NOT FOUND');
    
    // Test the backend query logic
    const backendQuery = {
      $or: [
        { phone: testPhone },
        { phone: testPhone.replace(/^\+/, '') },
        { phone: '+' + testPhone.replace(/^\+/, '') }
      ]
    };
    
    const backendMatch = await TelegramStats.findOne(backendQuery);
    console.log(`\nBackend query logic:`, backendMatch ? 'FOUND' : 'NOT FOUND');
    
    if (backendMatch) {
      console.log(`✅ Found with backend query!`);
      console.log(`   Phone: "${backendMatch.phone}"`);
      console.log(`   Most Active Users: ${backendMatch.mostActiveUsers?.length || 0}`);
      console.log(`   Most Active Groups: ${backendMatch.mostActiveGroups?.length || 0}`);
    }
    
    // Test the main stats query
    const mainStatsQuery = await TelegramStats.findOne({ phone: testPhone })
      .sort({ timestamp: -1 })
      .select('-__v');
    
    console.log(`\nMain stats query:`, mainStatsQuery ? 'FOUND' : 'NOT FOUND');
    
    if (mainStatsQuery) {
      console.log(`✅ Found with main query!`);
      console.log(`   Phone: "${mainStatsQuery.phone}"`);
      console.log(`   Most Active Users: ${mainStatsQuery.mostActiveUsers?.length || 0}`);
      console.log(`   Most Active Groups: ${mainStatsQuery.mostActiveGroups?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugPhoneFormat(); 