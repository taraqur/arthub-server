const stripe = require('../config/stripe');
exports.createCheckoutSession = async (req, res) => { res.json({ url: 'stripe_url' }); };
