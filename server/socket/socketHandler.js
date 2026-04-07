const userSocketMap = new Map();

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('join-room', ({ roomId, user }) => {
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
