import express from 'express';

const router = express.Router();

router.post('/start', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/end', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/:roomId', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
