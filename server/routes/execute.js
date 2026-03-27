import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/:token', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
