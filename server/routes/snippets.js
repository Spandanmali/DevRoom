import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/room/:roomId', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/user', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

router.delete('/:id', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
