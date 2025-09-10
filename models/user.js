const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type:String, unique:true },
  password: String,
  role: { 
    type: String, 
    enum: ['admin','moderator','editor','user'], 
    default: 'user' 
  }
}, { timestamps:true });

module.exports = mongoose.model('User', UserSchema);
