const express = require('express');
const router = express.Router();
const controller = require('../controllers/artwork.controller');
router.post('/', controller.createArtwork);
router.get('/', controller.getArtworks);
module.exports = router;
