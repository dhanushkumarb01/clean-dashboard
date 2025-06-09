const cron = require('node-cron');
const YouTubeTokenManager = require('./youtubeTokenManager');

// Schedule YouTube data sync every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Starting YouTube data sync...');
  try {
    const result = await YouTubeTokenManager.syncAllUsersYouTubeData();
    console.log(`YouTube sync completed: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.total} total`);
  } catch (error) {
    console.error('YouTube sync failed:', error);
  }
});

module.exports = {
  // Export if you need to manually trigger or manage the cron job
  startCronJobs: () => {
    console.log('Cron jobs started');
  }
};
