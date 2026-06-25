import { getDb } from '../config/db.js';
import { ObjectId } from 'mongodb';

export const getComments = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const comments = await getDb().collection('comments').find({ artworkId: artworkId.toString() }).sort({ createdAt: -1 }).toArray();
        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const userName = req.user.name;
        const userImage = req.user.image;
        const artworkId = req.params.id || req.body.artworkId;
        const { comment } = req.body;

        // Challenge Requirement: Verify Purchase
        const transaction = await getDb().collection('transactions').findOne({ buyerId: userId, artworkId: artworkId.toString(), status: 'completed' });
        if (!transaction) {
            return res.status(403).json({ message: "You can only comment on artworks you have purchased." });
        }
        
        const newComment = {
            artworkId: artworkId.toString(),
            userId,
            userName,
            userImage,
            comment,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await getDb().collection('comments').insertOne(newComment);
        res.status(201).json({ ...newComment, _id: result.insertedId });
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        const existingComment = await getDb().collection('comments').findOne({ _id: new ObjectId(id) });
        if (!existingComment) return res.status(404).json({ message: "Comment not found" });

        if (existingComment.userId !== userId) {
            return res.status(403).json({ message: "You can only edit your own comments." });
        }

        await getDb().collection('comments').updateOne(
            { _id: new ObjectId(id) },
            { $set: { comment, updatedAt: new Date() } }
        );
        
        const updatedComment = await getDb().collection('comments').findOne({ _id: new ObjectId(id) });
        res.json(updatedComment);
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existingComment = await getDb().collection('comments').findOne({ _id: new ObjectId(id) });
        if (!existingComment) return res.status(404).json({ message: "Comment not found" });

        if (existingComment.userId !== userId) {
            return res.status(403).json({ message: "You can only delete your own comments." });
        }

        await getDb().collection('comments').deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
