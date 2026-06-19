const Artwork = require('../models/Artwork');
exports.createArtwork = async (req, res) => { res.json({ message: 'Created' }); };
exports.getArtworks = async (req, res) => { 
  const { search, category, sort } = req.query;
  // apply filters...
  res.json({ message: 'Filtered List' });
 };
