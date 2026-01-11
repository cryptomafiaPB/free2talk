import * as mediasoup from 'mediasoup';
import type {
    Router,
    WebRtcTransport,
    Producer,
    Consumer,
    RtpCapabilities,
    DtlsParameters,
    RtpParameters,
    AudioLevelObserver,
} from 'mediasoup/types';
import { getNextWorker } from '../socket/mediasoup/workers.js';
import { AppError } from '../utils/app-error.js';
import { config } from '../config/env.js';

// mediasoup configuration
const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        preferredPayloadType: 111,
        parameters: {
            usedtx: 1, // Discontinuous transmission for bandwidth saving
            'sprop-stereo': 1,
        },
    },
];

// Transport configuration
const webRtcTransportOptions: mediasoup.types.WebRtcTransportOptions = {
    listenIps: [
        {
            ip: config.mediasoup.listenIp,
            announcedIp: config.mediasoup.announcedIp,
        },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
};

// In-memory state for rooms
interface RoomState {
    router: Router;
    audioLevelObserver: AudioLevelObserver;
    participants: Map<string, ParticipantState>;
}

interface ParticipantState {
    userId: string;
    sendTransport: WebRtcTransport | null;
    recvTransport: WebRtcTransport | null;
    producer: Producer | null;
    consumers: Map<string, Consumer>; // Map<producerId, Consumer>
}

// Room storage
const rooms = new Map<string, RoomState>();


//  * Create or get a router for a room

export async function getOrCreateRouter(roomId: string): Promise<Router> {
    let room = rooms.get(roomId);

    if (!room) {
        const worker = getNextWorker();
        const router = await worker.createRouter({ mediaCodecs });

        // Create AudioLevelObserver for speaking detection
        const audioLevelObserver = await router.createAudioLevelObserver({
            maxEntries: 1,
            threshold: -50,
            interval: 200,
        });

        room = {
            router,
            audioLevelObserver,
            participants: new Map(),
        };

        rooms.set(roomId, room);
        console.log(`Created router for room ${roomId}`);
    }

    return room.router;
}


//  * Get room state

export function getRoomState(roomId: string): RoomState | undefined {
    return rooms.get(roomId);
}

//  * Get or create participant state

export function getOrCreateParticipant(roomId: string, userId: string): ParticipantState {
    const room = rooms.get(roomId);
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    let participant = room.participants.get(userId);
    if (!participant) {
        participant = {
            userId,
            sendTransport: null,
            recvTransport: null,
            producer: null,
            consumers: new Map(),
        };
        room.participants.set(userId, participant);
    }

    return participant;
}

//  * Get RTP capabilities for the room router

export async function getRtpCapabilities(roomId: string): Promise<RtpCapabilities> {
    const router = await getOrCreateRouter(roomId);
    return router.rtpCapabilities;
}


//  * Create a WebRTC transport for a participant

export async function createTransport(
    roomId: string,
    userId: string,
    direction: 'send' | 'recv'
): Promise<{
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
}> {
    const router = await getOrCreateRouter(roomId);
    const participant = getOrCreateParticipant(roomId, userId);

    const transport = await router.createWebRtcTransport(webRtcTransportOptions);

    // Store transport reference
    if (direction === 'send') {
        participant.sendTransport = transport;
    } else {
        participant.recvTransport = transport;
    }

    // Listen for DTLS state changes
    transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed' || dtlsState === 'failed') {
            console.log(`Transport ${transport.id} closed/failed`);
            transport.close();
        }
    });

    console.log(`Created ${direction} transport for user ${userId} in room ${roomId}`);

    return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
    };
}


// * Connect a transport with DTLS parameters

export async function connectTransport(
    roomId: string,
    userId: string,
    transportId: string,
    dtlsParameters: DtlsParameters
): Promise<void> {
    const participant = getOrCreateParticipant(roomId, userId);

    let transport: WebRtcTransport | null = null;

    if (participant.sendTransport?.id === transportId) {
        transport = participant.sendTransport;
    } else if (participant.recvTransport?.id === transportId) {
        transport = participant.recvTransport;
    }

    if (!transport) {
        throw new AppError('Transport not found', 404);
    }

    await transport.connect({ dtlsParameters });
    console.log(`Connected transport ${transportId} for user ${userId}`);
}


//  * Create a producer (user starts sending audio)

export async function produce(
    roomId: string,
    userId: string,
    transportId: string,
    rtpParameters: RtpParameters,
    kind: 'audio' | 'video'
): Promise<string> {
    const room = rooms.get(roomId);
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const participant = getOrCreateParticipant(roomId, userId);

    if (!participant.sendTransport || participant.sendTransport.id !== transportId) {
        throw new AppError('Send transport not found', 404);
    }

    const producer = await participant.sendTransport.produce({
        kind,
        rtpParameters,
    });

    participant.producer = producer;

    // Add producer to AudioLevelObserver for speaking detection
    if (kind === 'audio') {
        await room.audioLevelObserver.addProducer({ producerId: producer.id });
    }

    producer.on('transportclose', () => {
        console.log(`Producer ${producer.id} transport closed`);
        producer.close();
    });

    console.log(`Created producer ${producer.id} for user ${userId} in room ${roomId}`);

    return producer.id;
}


//  * Create a consumer (user receives audio from another user)

export async function consume(
    roomId: string,
    userId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
): Promise<{
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
} | null> {
    const room = rooms.get(roomId);
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const participant = getOrCreateParticipant(roomId, userId);

    if (!participant.recvTransport) {
        throw new AppError('Receive transport not found', 404);
    }

    // Check if router can consume this producer
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
        console.log(`Cannot consume producer ${producerId} for user ${userId}`);
        return null;
    }

    const consumer = await participant.recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
    });

    participant.consumers.set(producerId, consumer);

    consumer.on('transportclose', () => {
        console.log(`Consumer ${consumer.id} transport closed`);
        consumer.close();
    });

    consumer.on('producerclose', () => {
        console.log(`Consumer ${consumer.id} producer closed`);
        participant.consumers.delete(producerId);
        consumer.close();
    });

    console.log(`Created consumer ${consumer.id} for producer ${producerId}`);

    return {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
    };
}


//  * Pause/resume producer (mute/unmute)

export async function setProducerPaused(
    roomId: string,
    userId: string,
    paused: boolean
): Promise<void> {
    const participant = getOrCreateParticipant(roomId, userId);

    if (!participant.producer) {
        throw new AppError('Producer not found', 404);
    }

    if (paused) {
        await participant.producer.pause();
    } else {
        await participant.producer.resume();
    }

    console.log(`Producer ${participant.producer.id} ${paused ? 'paused' : 'resumed'}`);
}


//  * Get all producers in a room except the given user

export function getOtherProducers(roomId: string, userId: string): Array<{ userId: string; producerId: string }> {
    const room = rooms.get(roomId);
    if (!room) {
        return [];
    }

    const producers: Array<{ userId: string; producerId: string }> = [];

    for (const [participantUserId, participant] of room.participants) {
        if (participantUserId !== userId && participant.producer && !participant.producer.closed) {
            producers.push({
                userId: participantUserId,
                producerId: participant.producer.id,
            });
        }
    }

    return producers;
}


//  * Get AudioLevelObserver for a room (for speaking detection)

export function getAudioLevelObserver(roomId: string): AudioLevelObserver | undefined {
    return rooms.get(roomId)?.audioLevelObserver;
}

//  * Clean up participant resources

export async function cleanupParticipant(roomId: string, userId: string): Promise<void> {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
        return;
    }

    // Close all consumers
    for (const consumer of participant.consumers.values()) {
        consumer.close();
    }
    participant.consumers.clear();

    // Close producer
    if (participant.producer) {
        participant.producer.close();
        participant.producer = null;
    }

    // Close transports
    if (participant.sendTransport) {
        participant.sendTransport.close();
        participant.sendTransport = null;
    }

    if (participant.recvTransport) {
        participant.recvTransport.close();
        participant.recvTransport = null;
    }

    // Remove participant
    room.participants.delete(userId);

    console.log(`Cleaned up participant ${userId} from room ${roomId}`);

    // Clean up room if empty
    if (room.participants.size === 0) {
        await cleanupRoom(roomId);
    }
}


//  * Clean up entire room

export async function cleanupRoom(roomId: string): Promise<void> {
    const room = rooms.get(roomId);
    if (!room) {
        return;
    }

    // Close all participants
    for (const userId of room.participants.keys()) {
        await cleanupParticipant(roomId, userId);
    }

    // Close router
    room.router.close();

    // Remove room
    rooms.delete(roomId);

    console.log(`Cleaned up room ${roomId}`);
}


//  * Get all active rooms

export function getActiveRooms(): string[] {
    return Array.from(rooms.keys());
}


//  * Get participant count in a room

export function getParticipantCount(roomId: string): number {
    const room = rooms.get(roomId);
    return room ? room.participants.size : 0;
}
