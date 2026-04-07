import { io } from 'socket.io-client';

// Change this based on your server configuration
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 'Infinity',
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };

    return io(SERVER_URL, options);
};
