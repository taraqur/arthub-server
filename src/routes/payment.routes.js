import express from 'express';
const router = express.Router();
import * as controller from '../controllers/payment.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

router.post('/create-checkout-session', isAuthenticated, controller.createCheckoutSession);
router.post('/subscription/checkout', isAuthenticated, controller.createSubscriptionCheckout);
router.post('/verify-session', controller.verifySession);

export default router;
