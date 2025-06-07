const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  commentId: { type: String, required: true, unique: true },
  videoId: { type: String, required: true },
  authorId: { type: String, required: true },
  text: String,
  publishedAt: Date,
  likeCount: Number,
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema); 