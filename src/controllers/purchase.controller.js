import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const getPurchases = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const purchases = await getDb().collection('transactions').find({ buyerId: userId }).sort({ createdAt: -1 }).toArray();
            
        // Manual populate artworkId
        const artworkIds = [...new Set(purchases.map(p => p.artworkId))].filter(Boolean);
        const objectIds = artworkIds.map(id => {
            try { return new ObjectId(id); } catch(e) { return null; }
        }).filter(Boolean);
        
        const artworks = await getDb().collection('artworks').find({ _id: { $in: objectIds } }).toArray();
        const artworkMap = artworks.reduce((acc, art) => {
            acc[art._id.toString()] = { _id: art._id, title: art.title, category: art.category, imageUrl: art.imageUrl };
            return acc;
        }, {});
        
        const populatedPurchases = purchases.map(p => ({
            ...p,
            artworkId: artworkMap[p.artworkId] || p.artworkId
        }));
            
        res.json(populatedPurchases);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createPurchase = async (req, res) => {
    // Note: In a real app, this happens via Stripe webhook.
    // This is a direct simulation for testing if requested.
    try {
        const userId = req.user.id;
        const userName = req.user.name;
        const { artworkId } = req.body;
        
        const artwork = await getDb().collection('artworks').findOne({ _id: new ObjectId(artworkId) });
        if (!artwork) return res.status(404).json({ message: "Artwork not found" });
        if (artwork.status === 'sold') return res.status(400).json({ message: "Artwork already sold" });
        
        const transaction = {
            buyerId: userId,
            buyerName: userName,
            artistId: artwork.artistId,
            artworkId: artwork._id.toString(),
            amount: artwork.price,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await getDb().collection('transactions').insertOne(transaction);
        
        // Mark artwork as sold
        await getDb().collection('artworks').updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { status: 'sold', updatedAt: new Date() } }
        );
        
        res.status(201).json(transaction);
    } catch (error) {
        console.error("Error creating purchase:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkPurchase = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const userId = req.user.id;
        
        const transaction = await getDb().collection('transactions').findOne({ buyerId: userId, artworkId: artworkId.toString(), status: 'completed' });
        res.json({ purchased: !!transaction });
    } catch (error) {
        console.error("Error checking purchase:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
