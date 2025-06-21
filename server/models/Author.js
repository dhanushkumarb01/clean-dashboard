const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema({
  authorId: { type: String, required: true, unique: true },
  displayName: String,
  profileImage: String,
  channelUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Author', AuthorSchema); 