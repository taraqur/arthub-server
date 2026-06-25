import { getDb } from '../config/db.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getDb().collection('user').findOne({ id: userId });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Exclude sensitive data
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, image } = req.body; // better-auth uses `name` and `image` natively
        
        const updateData = {};
        if (name) updateData.name = name;
        if (image) updateData.image = image;

        await getDb().collection('user').updateOne(
            { id: userId },
            { $set: updateData }
        );
        
        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const upgradeSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tier } = req.body; // 'free', 'pro', 'premium'
        
        await getDb().collection('user').updateOne(
            { id: userId },
            { $set: { subscriptionTier: tier } }
        );
        
        res.json({ message: `Successfully upgraded to ${tier} plan` });
    } catch (error) {
        console.error("Error upgrading subscription:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
