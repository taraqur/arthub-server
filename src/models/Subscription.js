const mongoose = require('mongoose');
const subSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tier: String,
  status: String
});
module.exports = mongoose.model('Subscription', subSchema);
