const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
  // You can use a session ID, user ID, or email as the identifier
  identifier: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true }
});

module.exports = mongoose.model('UserToken', userTokenSchema);
