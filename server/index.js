import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import snippetRoutes from './routes/snippets.js';
import aiRoutes from './routes/ai.js';
import executeRoutes from './routes/execute.js';
import interviewRoutes from './routes/interview.js';
import setupSocketHandlers from './socket/socketHandler.js';

import { WebSocketServer } from 'ws';
import yUtils from 'y-websocket/bin/utils';
import supabase from './lib/supabase.js';

const { setupWSConnection, docs, setPersistence } = yUtils;

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

// Set up Yjs WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Document persistence
const lastSaved = new Map();

const saveCodeToSupabase = async (docName, ydoc) => {
    try {
        const code = ydoc.getText('monaco').toString();
        const { data: snippets } = await supabase
            .from('snippets')
            .select('id')
            .eq('room_id', docName)
            .order('created_at', { ascending: false })
            .limit(1);

        if (snippets && snippets.length > 0) {
            await supabase.from('snippets').update({ code }).eq('id', snippets[0].id);
        } else {
            const { data: room } = await supabase.from('rooms').select('language').eq('id', docName).single();
            await supabase.from('snippets').insert({
                room_id: docName,
                title: 'Auto-save',
                code,
                language: room?.language || 'javascript'
            });
        }
        io.to(docName).emit('code-saved'); // Tell all clients in this room that code was saved
    } catch (e) {
        console.error(`Error saving snippet for room ${docName}:`, e);
    }
};

yUtils.setPersistence({
    bindState: async (docName, ydoc) => { },
    writeState: async (docName, ydoc) => {
        const currentCode = ydoc.getText('monaco').toString();
        if (lastSaved.get(docName) !== currentCode || !lastSaved.has(docName)) {
            await saveCodeToSupabase(docName, ydoc);
        }
        lastSaved.delete(docName);
    }
});

// Auto-save every 15 seconds
setInterval(() => {
    yUtils.docs.forEach((doc, docName) => {
        const currentCode = doc.getText('monaco').toString();
        if (lastSaved.get(docName) !== currentCode) {
            saveCodeToSupabase(docName, doc);
            lastSaved.set(docName, currentCode);
        }
    });
}, 15000);

wss.on('connection', (ws, req) => {
    // Extract document name from URL, e.g., /yjs/room123 -> room123
    const docName = req.url.split('/yjs/')[1]?.split('?')[0] || 'default';
    setupWSConnection(ws, req, { docName });
});

server.on('upgrade', (request, socket, head) => {
    // Only handle upgrades for the /yjs route (e.g., ws://localhost:5000/yjs/roomId)
    if (request.url.startsWith('/yjs/')) {
        // You can extract document name from the URL if needed, 
        // y-websocket does this natively by reading the last part of request.url
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



