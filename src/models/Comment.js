const mongoose = require('mongoose');
module.exports = mongoose.model('Comment', new mongoose.Schema({
  artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: String
}, { timestamps: true }));
