import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
    const { id, email, user_metadata, app_metadata, created_at } = req.user;

    res.json({
        user: {
            id,
            email,
            user_metadata,
            app_metadata,
            created_at,
        },
    });
});

export default router;
