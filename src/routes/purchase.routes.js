import express from 'express';
const router = express.Router();
import * as controller from '../controllers/purchase.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

router.use(isAuthenticated);
router.get('/', controller.getPurchases);
router.get('/check/:artworkId', controller.checkPurchase);
router.post('/', controller.createPurchase);

export default router;
