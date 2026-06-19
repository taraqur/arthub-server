const mongoose = require('mongoose');
const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'sold'], default: 'available' }
}, { timestamps: true });
module.exports = mongoose.model('Artwork', artworkSchema);
