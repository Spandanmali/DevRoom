import supabase from '../lib/supabase.js';

const userSocketMap = new Map();

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('join-room', async ({ roomId, user }) => {
            console.log(`[SERVER] Received join-room event from socket ID: ${socket.id} for roomId: ${roomId}, user: ${user?.name || user?.email || user?.id}`);

            userSocketMap.set(socket.id, { roomId, user });
            socket.join(roomId);

            const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
                return {
                    socketId,
                    user: userSocketMap.get(socketId)?.user
                };
            });

            // Notify everyone in the room (including the sender) about the updated user list
            console.log(`[SERVER] Broadcasting user-connected to roomId: ${roomId} - currently has ${clients.length} clients`);
            io.to(roomId).emit('user-connected', { user, socketId: socket.id, clients });

            // Load last 50 messages on room join
            try {
                const { data: messages, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) {
                    console.error('[SERVER] Error fetching messages:', error);
                } else {
                    // Send to the joined user (reverse to get chronological order: oldest to newest)
                    const chronologicalMessages = messages ? messages.reverse() : [];
                    socket.emit('load-messages', chronologicalMessages);
                }
            } catch (err) {
                console.error('[SERVER] Exception fetching messages:', err);
            }
        });

        socket.on('send-message', async ({ roomId, message }) => {
            console.log(`[SERVER] Received message from ${socket.id} for room ${roomId}: ${message}`);
            const userData = userSocketMap.get(socket.id);
            if (!userData) return;
            const { user } = userData;

            const newMessage = {
                room_id: roomId,
                user_id: user?.id || socket.id,
                username: user?.name || user?.email || 'Anonymous',
                content: message,
                created_at: new Date().toISOString()
            };

            // Broadcast to room
            io.to(roomId).emit('receive-message', newMessage);

            // Save to messages table
            try {
                const { error } = await supabase
                    .from('messages')
                    .insert([newMessage]);

                if (error) {
                    console.error('[SERVER] Error saving message:', error);
                }
            } catch (err) {
                console.error('[SERVER] Exception saving message:', err);
            }
        });

        socket.on('leave-room', ({ roomId }) => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                const { user, roomId: currentRoomId } = userData;
                if (currentRoomId === roomId) {
                    socket.leave(roomId);
                    userSocketMap.delete(socket.id);

                    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
                        return {
                            socketId,
                            user: userSocketMap.get(socketId)?.user
                        };
                    });

                    socket.to(roomId).emit('user-disconnected', { user, socketId: socket.id, clients });
                    console.log(`User ${user?.name || user?.email || socket.id} left room ${roomId}`);
                }
            }
        });

        // Interview Mode Events
        socket.on('start-interview', ({ roomId, session }) => {
            console.log(`[SERVER] Interview started in room ${roomId}`);
            io.to(roomId).emit('interview-started', { session });
        });

        socket.on('timer-sync', ({ roomId, timeLeft }) => {
            socket.to(roomId).emit('timer-update', { timeLeft });
        });

        socket.on('tab-switch', ({ roomId, candidateName, timestamp }) => {
            socket.to(roomId).emit('candidate-tab-switch', {
                candidateName,
                timestamp
            });
        });

        socket.on('end-interview', ({ roomId }) => {
            console.log(`[SERVER] Interview ended in room ${roomId}`);
            io.to(roomId).emit('interview-ended', {});
        });

        socket.on('disconnecting', () => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                const { user, roomId } = userData;
                socket.rooms.forEach((room) => {
                    if (room !== socket.id) {
                        const clients = Array.from(io.sockets.adapter.rooms.get(room) || [])
                            .filter(socketId => socketId !== socket.id)
                            .map(socketId => {
                                return {
                                    socketId,
                                    user: userSocketMap.get(socketId)?.user
                                };
                            });

                        socket.to(room).emit('user-disconnected', { user, socketId: socket.id, clients });
                    }
                });
            }
        });

        socket.on('disconnect', () => {
            userSocketMap.delete(socket.id);
            console.log('Socket disconnected:', socket.id);
        });
    });
}

export default setupSocketHandlers;
