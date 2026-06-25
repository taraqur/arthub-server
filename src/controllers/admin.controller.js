import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

// --- DASHBOARD STATS ---
export const getStats = async (req, res, next) => {
    try {
        const totalUsers = await getDb().collection('user').countDocuments();
        const totalArtists = await getDb().collection('user').countDocuments({ role: 'artist' });
        const artworksSold = await getDb().collection('artworks').countDocuments({ status: 'sold' });
        
        const revenueAggregation = await getDb().collection('transactions').aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        res.json({
            totalUsers,
            totalArtists,
            artworksSold,
            totalRevenue
        });
    } catch (error) {
        next(error);
    }
};

// --- USERS ---
export const getUsers = async (req, res, next) => {
    try {
        const users = await getDb().collection('user').find().toArray();
        console.log(`Fetched ${users.length} users from db`);
        
        // Calculate dummy revenue or fetch from transactions if needed
        const formattedUsers = users.map(user => ({
            id: user._id,
            name: user.name || 'Unknown',
            email: user.email,
            avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
            status: 'ACTIVE',
            role: user.role || 'buyer',
            revenue: '$0', // Can be aggregated from transactions
            createdAt: user.createdAt
        }));
        
        console.log(`Sending ${formattedUsers.length} users to frontend`);
        res.json(formattedUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        next(error);
    }
};

export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        await getDb().collection('user').updateOne(
            { _id: id },
            { $set: { role } }
        );
        
        await getDb().collection('auditLogs').insertOne({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'UPDATE_ROLE',
            targetId: id,
            targetModel: 'User',
            details: `Updated role to ${role}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await getDb().collection('user').deleteOne({ _id: id });
        
        await getDb().collection('auditLogs').insertOne({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'DELETE_USER',
            targetId: id,
            targetModel: 'User',
            details: `Deleted user ${id}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- CURATIONS / ARTWORKS ---
export const getArtworks = async (req, res, next) => {
    try {
        const artworks = await getDb().collection('artworks').find().sort({ createdAt: -1 }).toArray();
        
        // Manual populate for artistId
        const artistIds = [...new Set(artworks.map(a => a.artistId).filter(Boolean))];
        const users = await getDb().collection('user').find({ id: { $in: artistIds } }).toArray();
        const userMap = users.reduce((acc, user) => {
            acc[user.id] = { _id: user._id, name: user.name, email: user.email };
            return acc;
        }, {});

        const populatedArtworks = artworks.map(art => ({
            ...art,
            artistId: userMap[art.artistId] || art.artistId
        }));
        
        res.json(populatedArtworks);
    } catch (error) {
        next(error);
    }
};

export const updateArtworkStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await getDb().collection('artworks').findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        
        await getDb().collection('auditLogs').insertOne({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'UPDATE_ARTWORK_STATUS',
            targetId: id,
            targetModel: 'Artwork',
            details: `Changed status to ${status}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json(result || result.value);
    } catch (error) {
        next(error);
    }
};

export const deleteArtwork = async (req, res, next) => {
    try {
        const { id } = req.params;
        await getDb().collection('artworks').deleteOne({ _id: new ObjectId(id) });
        
        await getDb().collection('auditLogs').insertOne({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'DELETE_ARTWORK',
            targetId: id,
            targetModel: 'Artwork',
            details: `Deleted artwork ${id}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.json({ message: 'Artwork deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- TRANSACTIONS ---
export const getTransactions = async (req, res, next) => {
    try {
        const transactions = await getDb().collection('transactions').find().sort({ createdAt: -1 }).toArray();
        res.json(transactions);
    } catch (error) {
        next(error);
    }
};

// --- AUDIT LOGS ---
export const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await getDb().collection('auditLogs').find().sort({ createdAt: -1 }).toArray();
        res.json(logs);
    } catch (error) {
        next(error);
    }
};
