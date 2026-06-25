import express from 'express';
const router = express.Router();
import * as controller from '../controllers/artwork.controller.js';
import { isArtist } from '../middlewares/auth.middleware.js';

// Public routes
router.get('/', controller.getArtworks);
router.get('/:id', controller.getArtworkById);

// Protected artist routes
router.post('/', isArtist, controller.createArtwork);
router.patch('/:id', isArtist, controller.updateArtwork);
router.delete('/:id', isArtist, controller.deleteArtwork);

import * as commentController from '../controllers/comment.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
router.post('/:id/comments', isAuthenticated, commentController.createComment);

export default router;
