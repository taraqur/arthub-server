import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const isAuthenticated = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        
        if (!session || !session.user) {
            return res.status(401).json({ message: "Unauthorized: No active session" });
        }
        
        req.user = session.user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error during authentication" });
    }
};

export const isArtist = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        
        if (!session || !session.user) {
            return res.status(401).json({ message: "Unauthorized: No active session" });
        }
        
        if (session.user.role !== 'artist' && session.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Requires artist privileges" });
        }
        
        req.user = session.user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error during authentication" });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        
        if (!session || !session.user) {
            return res.status(401).json({ message: "Unauthorized: No active session" });
        }
        
        if (session.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Requires admin privileges" });
        }
        req.user = session.user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ message: "Internal server error during authentication" });
    }
};
