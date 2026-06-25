import express from 'express';
const router = express.Router();
import * as controller from '../controllers/user.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

router.use(isAuthenticated);

router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);
router.patch('/subscription', controller.upgradeSubscription);

export default router;
