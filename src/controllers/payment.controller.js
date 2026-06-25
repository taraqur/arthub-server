import { getDb } from '../config/db.js';
import stripe from '../config/stripe.js';
import { ObjectId } from 'mongodb';

export const createCheckoutSession = async (req, res) => {
    try {
        const { artworkId } = req.body;
        const userId = req.user.id;

        let userQuery = [{ id: userId }, { _id: userId }];
        if (ObjectId.isValid(userId)) {
            userQuery.push({ _id: new ObjectId(userId) });
        }
        const user = await getDb().collection('user').findOne({ $or: userQuery });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.subscriptionTier !== 'premium' && user.remainingPurchases <= 0) {
            return res.status(403).json({ message: "Purchase limit reached. Please upgrade your subscription." });
        }

        const artwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(artworkId) });
        if (!artwork) return res.status(404).json({ message: "Artwork not found" });

        if (artwork.status === 'sold') {
            return res.status(400).json({ message: "Artwork is already sold" });
        }

        const sessionConfig = {
            payment_method_types: ['card'],
            client_reference_id: userId.toString(),
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: artwork.title,
                            images: (artwork.imageUrl && artwork.imageUrl.startsWith('http')) ? [artwork.imageUrl] : [],
                        },
                        unit_amount: Math.round(artwork.price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/dashboard/user/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/artwork/${artworkId}?canceled=true`,
            metadata: {
                type: 'purchase',
                userId: userId.toString(),
                artistId: artwork.artistId.toString(),
                artworkId: artworkId.toString(),
                artworkTitle: artwork.title,
                buyerName: user.name || user.fullName || "Unknown",
            }
        };

        if (user.email) {
            sessionConfig.customer_email = user.email;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createSubscriptionCheckout = async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user.id;
        
        let amount = 0;
        let name = "";
        
        if (tier === 'pro') {
            amount = 999;
            name = "Pro Subscription";
        } else if (tier === 'premium') {
            amount = 1999;
            name = "Premium Subscription";
        } else {
            return res.status(400).json({ message: "Invalid subscription tier" });
        }

        let userQuery = [{ id: userId }, { _id: userId }];
        if (ObjectId.isValid(userId)) {
            userQuery.push({ _id: new ObjectId(userId) });
        }
        const user = await getDb().collection('user').findOne({ $or: userQuery });
        if (user && user.subscriptionTier === tier) {
            return res.status(400).json({ message: "You are already subscribed to this package." });
        }

        const sessionParams = {
            payment_method_types: ['card'],
            client_reference_id: userId.toString(),
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name },
                        unit_amount: amount,
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/dashboard/user/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard/user/subscription?canceled=true`,
            metadata: {
                type: 'subscription',
                userId: userId.toString(),
                tier: tier
            }
        };

        if (user && user.stripeCustomerId) {
            sessionParams.customer = user.stripeCustomerId;
        } else if (user && user.email) {
            sessionParams.customer_email = user.email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error creating subscription checkout:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createPortalSession = async (req, res) => {
    try {
        const userId = req.user.id;
        let userQuery = [{ id: userId }, { _id: userId }];
        if (ObjectId.isValid(userId)) {
            userQuery.push({ _id: new ObjectId(userId) });
        }
        const user = await getDb().collection('user').findOne({ $or: userQuery });

        if (!user || !user.stripeCustomerId) {
            return res.status(400).json({ message: "No active Stripe customer found for this user." });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL}/dashboard/user/subscription`,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error("Error creating portal session:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const webhook = async (req, res) => {
    let event = req.body;

    try {
        if (process.env.STRIPE_WEBHOOK_SECRET && req.headers['stripe-signature']) {
            const sig = req.headers['stripe-signature'];
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = getDb();

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;

        try {
            if (session.mode === 'payment' || metadata?.type === 'purchase') {
                const { userId, artistId, artworkId, artworkTitle, buyerName } = metadata;
                
                await db.collection('transactions').insertOne({
                    type: 'purchase',
                    buyerId: userId,
                    buyerName,
                    artistId,
                    artworkId,
                    artworkTitle,
                    amount: session.amount_total / 100,
                    currency: session.currency || 'usd',
                    status: 'completed',
                    stripeSessionId: session.id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (artworkId) {
                    await db.collection('artworks').updateOne(
                        { _id: new ObjectId(artworkId) },
                        { $set: { status: 'sold', updatedAt: new Date() } }
                    );
                }

                let userQuery = [{ id: userId }, { _id: userId }];
                if (ObjectId.isValid(userId)) {
                    userQuery.push({ _id: new ObjectId(userId) });
                }
                const user = await db.collection('user').findOne({ $or: userQuery });
                if (user && user.subscriptionTier !== 'premium') {
                    const remainingPurchases = Math.max(0, (user.remainingPurchases || 0) - 1);
                    await db.collection('user').updateOne({ $or: userQuery }, { $set: { remainingPurchases, purchasesCount: (user.purchasesCount || 0) + 1 } });
                }

            } else if (session.mode === 'subscription' || metadata?.type === 'subscription') {
                const { userId, tier, buyerName } = metadata;
                let userQuery = [{ id: userId }, { _id: userId }];
                if (ObjectId.isValid(userId)) {
                    userQuery.push({ _id: new ObjectId(userId) });
                }
                const user = await db.collection('user').findOne({ $or: userQuery });

                const stripeCustomerId = session.customer;

                await db.collection('transactions').insertOne({
                    type: 'subscription',
                    buyerId: userId,
                    buyerName: buyerName || (user?.name || "Unknown"),
                    artworkTitle: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`,
                    amount: session.amount_total / 100,
                    currency: session.currency || 'usd',
                    status: 'completed',
                    stripeSessionId: session.id,
                    stripeSubscriptionId: session.subscription,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (user) {
                    let remainingPurchases = tier === 'premium' ? 999999 : (tier === 'pro' ? 9 : 3);
                    await db.collection('user').updateOne(
                        { $or: userQuery },
                        { $set: { subscriptionTier: tier, remainingPurchases, stripeCustomerId } }
                    );
                }
            }
        } catch (error) {
            console.error("Error processing webhook checkout session:", error);
        }
    } 
    else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        try {
            await db.collection('user').updateOne(
                { stripeCustomerId: subscription.customer },
                { $set: { subscriptionTier: 'free', remainingPurchases: 3 } }
            );
        } catch (error) {
            console.error("Error handling subscription deletion:", error);
        }
    }

    res.json({ received: true });
};

export const verifySession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: "Session ID required" });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) return res.status(404).json({ message: "Session not found" });

        const db = getDb();

        // Check if transaction already exists to avoid duplicates
        const existingTx = await db.collection('transactions').findOne({ stripeSessionId: sessionId });
        if (existingTx) {
            return res.json({ message: "Already processed" });
        }

        const metadata = session.metadata;

        if (metadata && metadata.type === 'purchase') {
            const { userId, artistId, artworkId, artworkTitle, buyerName } = metadata;

            await db.collection('transactions').insertOne({
                type: 'purchase',
                buyerId: userId && userId !== "Unknown" ? userId : "Guest",
                buyerName: buyerName !== "Unknown" ? buyerName : "Guest",
                artistId,
                artworkId,
                artworkTitle,
                amount: session.amount_total / 100,
                currency: session.currency || 'usd',
                status: 'completed',
                stripeSessionId: session.id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Update artwork status to sold
            if (artworkId) {
                await db.collection('artworks').updateOne(
                    { _id: new ObjectId(artworkId) },
                    { $set: { status: 'sold', updatedAt: new Date() } }
                );
            }

            if (userId && userId !== "Unknown") {
                let userQuery = [{ id: userId }, { _id: userId }];
                if (ObjectId.isValid(userId)) {
                    userQuery.push({ _id: new ObjectId(userId) });
                }
                const user = await db.collection('user').findOne({ $or: userQuery });
                if (user && user.subscriptionTier !== 'premium') {
                    await db.collection('user').updateOne(
                        { id: userId },
                        { 
                            $inc: { remainingPurchases: -1, purchasesCount: 1 }
                        }
                    );
                }
            }
        } else if (metadata && metadata.type === 'subscription') {
            const { userId, tier, buyerName } = metadata;
            
            let user = null;
            if (userId && userId !== "Unknown") {
                user = await db.collection('user').findOne({ id: userId });
            }

            await db.collection('transactions').insertOne({
                type: 'subscription',
                buyerId: userId && userId !== "Unknown" ? userId : "Guest",
                buyerName: buyerName !== "Unknown" ? buyerName : (user ? (user.name || user.fullName || "Unknown") : "Guest"),
                artworkTitle: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`,
                amount: session.amount_total / 100,
                currency: session.currency || 'usd',
                status: 'completed',
                stripeSessionId: session.id,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            if (user && userId && userId !== "Unknown") {
                const remainingPurchases = tier === 'premium' ? 999999 : (tier === 'pro' ? 9 : 3);
                await db.collection('user').updateOne(
                    { id: userId },
                    { 
                        $set: { 
                            subscriptionTier: tier,
                            remainingPurchases: remainingPurchases
                        }
                    }
                );
            }
        }

        res.json({ message: "Processed successfully" });
    } catch (error) {
        console.error("Error verifying session:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
