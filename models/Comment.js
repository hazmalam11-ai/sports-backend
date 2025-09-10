const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  hidden: { type: Boolean, default: false } // للموديريشن
}, { timestamps:true });

module.exports = mongoose.model('Comment', CommentSchema);
