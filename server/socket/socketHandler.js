function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        socket.on('join-room', ({ roomId, user }) => {
            socket.join(roomId);
            socket.to(roomId).emit('user-joined', { user });
        });

        socket.on('leave-room', ({ roomId, user }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('user-left', { user });
        });

        socket.on('disconnect', () => {
            // Presence cleanup will be added in Phase 5.
        });
    });
}

export default setupSocketHandlers;
