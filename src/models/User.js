const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
  avatar: String,
  subscriptionTier: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  purchasesCount: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
