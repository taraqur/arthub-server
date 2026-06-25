import express from 'express';
const router = express.Router();
import * as controller from '../controllers/sales.controller.js';
import { isArtist } from '../middlewares/auth.middleware.js';

router.use(isArtist);
router.get('/history', controller.getSalesHistory);

export default router;
