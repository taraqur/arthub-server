import express from 'express';
const router = express.Router();
import * as controller from '../controllers/comment.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

router.get('/:artworkId', controller.getComments);
router.post('/', isAuthenticated, controller.createComment);
router.patch('/:id', isAuthenticated, controller.updateComment);
router.delete('/:id', isAuthenticated, controller.deleteComment);

export default router;
