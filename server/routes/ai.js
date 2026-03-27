import express from 'express';

const router = express.Router();

router.post('/review', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/fix', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/evaluate', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
