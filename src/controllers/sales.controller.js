import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const getSalesHistory = async (req, res) => {
    try {
        const artistId = req.user.id;
        
        const sales = await getDb().collection('transactions').find({ artistId, status: 'completed' }).sort({ createdAt: -1 }).toArray();
            
        const artworkIds = [...new Set(sales.map(s => s.artworkId))].filter(Boolean);
        const objectIds = artworkIds.map(id => {
            try { return new ObjectId(id); } catch(e) { return null; }
        }).filter(Boolean);
        
        const artworks = await getDb().collection('artworks').find({ _id: { $in: objectIds } }).toArray();
        const artworkMap = artworks.reduce((acc, art) => {
            acc[art._id.toString()] = { _id: art._id, title: art.title };
            return acc;
        }, {});
        
        const populatedSales = sales.map(s => ({
            ...s,
            artworkId: artworkMap[s.artworkId] || s.artworkId
        }));
            
        res.json(populatedSales);
    } catch (error) {
        console.error("Error fetching sales history:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
