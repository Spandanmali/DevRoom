import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import snippetRoutes from './routes/snippets.js';
import aiRoutes from './routes/ai.js';
import executeRoutes from './routes/execute.js';
import interviewRoutes from './routes/interview.js';
import setupSocketHandlers from './socket/socketHandler.js';

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'server', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/interview', interviewRoutes);

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

setupSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
