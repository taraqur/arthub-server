import express from 'express';
import { isAdmin } from '../middlewares/auth.middleware.js';
import {
    getStats,
    getUsers,
    updateUserRole,
    deleteUser,
    getArtworks,
    updateArtworkStatus,
    deleteArtwork,
    getTransactions,
    getAuditLogs
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAdmin); // Protect all routes in this file

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Artworks / Curations
router.get('/artworks', getArtworks);
router.put('/artworks/:id/status', updateArtworkStatus);
router.delete('/artworks/:id', deleteArtwork);

// Transactions
router.get('/transactions', getTransactions);

// Audit Logs
router.get('/logs', getAuditLogs);

export default router;
