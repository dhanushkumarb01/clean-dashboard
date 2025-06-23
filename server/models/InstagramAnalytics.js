const mongoose = require('mongoose');

const InstagramAnalyticsSchema = new mongoose.Schema({
  instagram_account_id: { type: String, required: true, unique: true },
  engagement_data: [mongoose.Schema.Types.Mixed],
  active_users: [mongoose.Schema.Types.Mixed],
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InstagramAnalytics', InstagramAnalyticsSchema); 