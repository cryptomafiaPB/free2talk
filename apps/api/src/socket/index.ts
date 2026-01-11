import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@free2talk/shared';
import { verifyAccessToken } from '../utils/JWT.js';
import * as voiceService from '../services/voice.service.js';
import * as roomService from '../services/room.service.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { UserCache } from '../services/cache.service.js';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
    userId?: string;
    roomId?: string;
};

// Track user connections
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export function initSocketHandlers(
    io: Server<ClientToServerEvents, ServerToClientEvents>
) {
    // Authentication middleware
    io.use(async (socket: AuthSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication token missing'));
            }

            const payload = verifyAccessToken(token);
            socket.userId = payload.userId;


            console.log(`Socket authenticated: ${socket.id} (User: ${payload.userId})`);
            next();
        } catch (error) {
            console.error('Socket authentication failed:', error);
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', async (socket: AuthSocket) => {
        const userId = socket.userId!;
        console.log(`Client connected: ${socket.id} (User: ${userId})`);

        // Track connection
        userSockets.set(userId, socket.id);
        socketUsers.set(socket.id, userId);

        // Update user online status (DB + Redis)
        await db.update(users).set({ isOnline: true }).where(eq(users.id, userId));
        await UserCache.setOnline(userId);

        // ==================== Hallway Events ====================

        socket.on('hallway:subscribe', async () => {
            socket.join('hallway');
            console.log(`User ${userId} subscribed to hallway`);
        });

        socket.on('hallway:unsubscribe', () => {
            socket.leave('hallway');
            console.log(`User ${userId} unsubscribed from hallway`);
        });

        // ==================== Room Events ====================

        socket.on('room:join', async (roomId: string) => {
            try {
                // Verify user can join the room
                const room = await roomService.getRoomById(roomId);

                if (!room.isActive) {
                    socket.emit('error', { code: 'ROOM_CLOSED', message: 'Room is closed' });
                    return;
                }

                // Join room socket channel
                socket.join(`room:${roomId}`);
                socket.roomId = roomId;

                console.log(`User ${userId} joined room ${roomId}`);

                // Get participant info
                const participants = await roomService.getRoomParticipants(roomId);
                const participant = participants.find((p) => p.oderId === userId);

                if (participant) {
                    // Notify others in the room
                    socket.to(`room:${roomId}`).emit('room:user-joined', {
                        id: participant.id,
                        userId: participant.oderId,
                        username: participant.username,
                        displayName: participant.displayName || undefined,
                        avatarUrl: participant.avatarUrl || undefined,
                        role: participant.role,
                        isMuted: false,
                        isSpeaking: false,
                        joinedAt: participant.joinedAt,
                    });
                }
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join room' });
            }
        });

        socket.on('room:leave', async (roomId: string) => {
            try {
                socket.leave(`room:${roomId}`);
                socket.roomId = undefined;

                // Notify others
                socket.to(`room:${roomId}`).emit('room:user-left', userId);

                // Cleanup voice resources
                await voiceService.cleanupParticipant(roomId, userId);

                console.log(`User ${userId} left room ${roomId}`);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        });

        socket.on('room:mute', async (muted: boolean) => {
            try {
                if (!socket.roomId) {
                    return;
                }

                await voiceService.setProducerPaused(socket.roomId, userId, muted);

                // Notify others
                socket.to(`room:${socket.roomId}`).emit('room:user-muted', userId, muted);

                console.log(`User ${userId} ${muted ? 'muted' : 'unmuted'}`);
            } catch (error) {
                console.error('Error muting/unmuting:', error);
            }
        });

        // ==================== Voice (mediasoup) Events ====================

        socket.on('voice:get-rtp-capabilities', async (callback) => {
            try {
                if (!socket.roomId) {
                    callback(null as any);
                    return;
                }

                const rtpCapabilities = await voiceService.getRtpCapabilities(socket.roomId);
                callback(rtpCapabilities);
            } catch (error) {
                console.error('Error getting RTP capabilities:', error);
                callback(null as any);
            }
        });

        socket.on('voice:create-transport', async (direction, callback) => {
            try {
                if (!socket.roomId) {
                    callback(null as any);
                    return;
                }

                const transportParams = await voiceService.createTransport(
                    socket.roomId,
                    userId,
                    direction
                );
                callback(transportParams);
            } catch (error) {
                console.error('Error creating transport:', error);
                callback(null as any);
            }
        });

        socket.on('voice:connect-transport', async (transportId, dtlsParameters, callback) => {
            try {
                if (!socket.roomId) {
                    callback();
                    return;
                }

                await voiceService.connectTransport(
                    socket.roomId,
                    userId,
                    transportId,
                    dtlsParameters
                );
                callback();
            } catch (error) {
                console.error('Error connecting transport:', error);
                callback();
            }
        });

        socket.on('voice:produce', async (transportId, rtpParameters, callback) => {
            try {
                if (!socket.roomId) {
                    callback('' as any);
                    return;
                }

                const producerId = await voiceService.produce(
                    socket.roomId,
                    userId,
                    transportId,
                    rtpParameters,
                    'audio'
                );

                // Notify others about new producer
                socket.to(`room:${socket.roomId}`).emit('voice:new-producer', userId, producerId);

                // Setup speaking detection
                setupSpeakingDetection(io, socket.roomId, userId);

                callback(producerId);
            } catch (error) {
                console.error('Error producing:', error);
                callback('' as any);
            }
        });

        socket.on('voice:consume', async (producerId, callback) => {
            try {
                if (!socket.roomId) {
                    callback(null as any);
                    return;
                }

                // Get the router's RTP capabilities (needed for consume)
                const rtpCapabilities = await voiceService.getRtpCapabilities(socket.roomId);

                const consumerParams = await voiceService.consume(
                    socket.roomId,
                    userId,
                    producerId,
                    rtpCapabilities
                );

                if (consumerParams) {
                    // Find the producer's userId
                    const room = voiceService.getRoomState(socket.roomId);
                    let producerUserId = '';
                    if (room) {
                        for (const [uid, participant] of room.participants) {
                            if (participant.producer?.id === producerId) {
                                producerUserId = uid;
                                break;
                            }
                        }
                    }

                    callback({
                        ...consumerParams,
                        userId: producerUserId,
                    });
                } else {
                    callback(null);
                }
            } catch (error) {
                console.error('Error consuming:', error);
                callback(null);
            }
        });

        // ==================== Disconnect ====================

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id} (User: ${userId})`);

            // Cleanup tracking
            userSockets.delete(userId);
            socketUsers.delete(socket.id);

            // Update user online status (DB + Redis)
            await db.update(users).set({ isOnline: false, lastSeenAt: new Date() }).where(eq(users.id, userId));
            await UserCache.setOffline(userId);

            // Cleanup voice resources if in a room
            if (socket.roomId) {
                try {
                    await voiceService.cleanupParticipant(socket.roomId, userId);

                    // Notify others
                    socket.to(`room:${socket.roomId}`).emit('room:user-left', userId);

                    // Handle room cleanup or ownership transfer
                    const room = await roomService.getRoomById(socket.roomId);
                    if (room.ownerId === userId) {
                        const participants = await roomService.getRoomParticipants(socket.roomId);
                        if (participants.length > 1) {
                            // Transfer ownership to the next participant
                            const nextOwner = participants.find((p) => p.oderId !== userId);
                            if (nextOwner) {
                                await roomService.transferOwnership(socket.roomId, userId, nextOwner.oderId);
                                io.to(`room:${socket.roomId}`).emit('room:owner-changed', nextOwner.oderId);
                            }
                        } else {
                            // Close room if owner was the last participant
                            await roomService.closeRoom(socket.roomId, userId);
                            io.to('hallway').emit('hallway:room-closed', socket.roomId);
                        }
                    }
                } catch (error) {
                    console.error('Error during disconnect cleanup:', error);
                }
            }
        });
    });
}

// Helper: Setup speaking detection for a user
function setupSpeakingDetection(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    roomId: string,
    userId: string
) {
    const audioLevelObserver = voiceService.getAudioLevelObserver(roomId);
    if (!audioLevelObserver) {
        return;
    }

    // Listen for volume changes
    audioLevelObserver.on('volumes', (volumes) => {
        // volumes is an array of { producer, volume }
        if (volumes.length > 0) {
            const loudestProducer = volumes[0].producer;

            // Find which user owns this producer
            const room = voiceService.getRoomState(roomId);
            if (room) {
                for (const [uid, participant] of room.participants) {
                    if (participant.producer?.id === loudestProducer.id) {
                        io.to(`room:${roomId}`).emit('room:active-speaker', uid);
                        break;
                    }
                }
            }
        }
    });

    // Listen for silence
    audioLevelObserver.on('silence', () => {
        io.to(`room:${roomId}`).emit('room:active-speaker', null);
    });
}

// Helper: Broadcast to hallway when rooms change
export async function broadcastRoomUpdate(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    event: 'created' | 'updated' | 'closed',
    roomId: string
) {
    try {
        if (event === 'closed') {
            io.to('hallway').emit('hallway:room-closed', roomId);
        } else {
            const room = await roomService.getRoomById(roomId);
            const roomSummary = {
                id: room.id,
                name: room.name,
                topic: room.topic || undefined,
                languages: room.languages || [],
                participantCount: room.participantCount,
                maxParticipants: room.maxParticipants,
                ownerId: room.ownerId,
                ownerName: room.owner.username,
            };

            if (event === 'created') {
                io.to('hallway').emit('hallway:room-created', roomSummary);
            } else {
                io.to('hallway').emit('hallway:room-updated', roomSummary);
            }
        }
    } catch (error) {
        console.error('Error broadcasting room update:', error);
    }
}
