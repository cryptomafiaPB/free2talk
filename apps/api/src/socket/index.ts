import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@free2talk/shared';

export function initSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents>
) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // TODO: Implement socket event handlers
        // - Authentication
        // - Hallway subscription
        // - Room join/leave
        // - Voice signaling (mediasoup)

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}
