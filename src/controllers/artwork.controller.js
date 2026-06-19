const Artwork = require('../models/Artwork');
exports.createArtwork = async (req, res) => { res.json({ message: 'Created' }); };
exports.getArtworks = async (req, res) => { res.json({ message: 'List' }); };
