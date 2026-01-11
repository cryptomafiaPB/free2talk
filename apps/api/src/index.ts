import 'dotenv/config';
import { app } from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocketHandlers } from './socket/index.js';
import { initMediasoupWorkers } from './socket/mediasoup/workers.js';
import { setSocketInstance } from './socket/socket-instance.js';
import { connectRedis, disconnectRedis } from './db/redis.js';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

// Initialize mediasoup workers
async function start() {
    try {
        // Connect to Redis
        await connectRedis();
        console.log('✓ Redis initialized');

        await initMediasoupWorkers();
        console.log('✓ mediasoup workers initialized');

        // Set socket instance for global access
        setSocketInstance(io);

        // Initialize socket handlers
        initSocketHandlers(io);
        console.log('✓ Socket.io handlers initialized');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await disconnectRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await disconnectRedis();
    process.exit(0);
});

start();
