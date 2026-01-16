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

// Transport configuration with STUN servers for NAT traversal
const getWebRtcTransportOptions = (): mediasoup.types.WebRtcTransportOptions => {
    const listenIps = [
        {
            ip: config.mediasoup.listenIp,
            announcedIp: config.mediasoup.announcedIp,
        },
    ];

    const options: mediasoup.types.WebRtcTransportOptions = {
        listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    };

    // Production-specific optimizations: increase bitrate and message size for better audio quality
    if (config.nodeEnv === 'production') {
        options.initialAvailableOutgoingBitrate = 1000000; // 1 Mbps
        options.maxSctpMessageSize = 262144; // 256KB
    }

    return options;
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

    const transport = await router.createWebRtcTransport(getWebRtcTransportOptions());

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
    console.log(`[Transport] ICE Parameters:`, JSON.stringify(transport.iceParameters, null, 2));
    console.log(`[Transport] ICE Candidates Available: ${transport.iceCandidates.length}`);
    transport.iceCandidates.forEach((cand, idx) => {
        console.log(`[Transport] Candidate ${idx}:`, JSON.stringify(cand, null, 2));
    });
    console.log(`[Transport] DTLS Parameters:`, JSON.stringify(transport.dtlsParameters, null, 2));
    console.log(`[Transport] Announced IP being sent:`, transport.iceCandidates[0]?.ip || 'UNKNOWN');

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
    let transportType = '';

    if (participant.sendTransport?.id === transportId) {
        transport = participant.sendTransport;
        transportType = 'send';
    } else if (participant.recvTransport?.id === transportId) {
        transport = participant.recvTransport;
        transportType = 'recv';
    }

    if (!transport) {
        console.error(`[ConnectTransport] Transport not found! User: ${userId}, Transport ID: ${transportId}`);
        throw new AppError('Transport not found', 404);
    }

    console.log(`[ConnectTransport] Connecting ${transportType} transport for user ${userId}`);
    console.log(`[ConnectTransport] Transport ID: ${transportId}`);
    console.log(`[ConnectTransport] DTLS Parameters:`, JSON.stringify(dtlsParameters, null, 2));

    await transport.connect({ dtlsParameters });

    console.log(`[ConnectTransport] ✅ ${transportType} transport connected successfully! User: ${userId}, Transport: ${transportId}`);
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

    console.log(`[Produce] Creating producer for user ${userId} in room ${roomId}`);
    console.log(`[Produce] Transport ID: ${transportId}`);
    console.log(`[Produce] Kind: ${kind}`);
    console.log(`[Produce] RTP Parameters:`, JSON.stringify(rtpParameters, null, 2));

    const producer = await participant.sendTransport.produce({
        kind,
        rtpParameters,
    });

    console.log(`[Produce] Producer created successfully!`);
    console.log(`[Produce] Producer ID: ${producer.id}`);
    console.log(`[Produce] Producer paused: ${producer.paused}`);
    console.log(`[Produce] Producer closed: ${producer.closed}`);

    participant.producer = producer;

    // Add producer to AudioLevelObserver for speaking detection
    if (kind === 'audio') {
        console.log(`[Produce] Adding producer to AudioLevelObserver`);
        await room.audioLevelObserver.addProducer({ producerId: producer.id });
        console.log(`[Produce] Producer added to AudioLevelObserver`);
    }

    producer.on('transportclose', () => {
        console.log(`[Produce] Producer ${producer.id} transport closed`);
        producer.close();
    });

    console.log(`[Produce] Producer ready to send audio: ${producer.id} for user ${userId}`);

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

    console.log(`[Consume] Creating consumer for user ${userId} in room ${roomId}`);
    console.log(`[Consume] Producer ID: ${producerId}`);
    console.log(`[Consume] Recv transport ID: ${participant.recvTransport.id}`);

    // Check if router can consume this producer
    const canConsume = room.router.canConsume({ producerId, rtpCapabilities });
    console.log(`[Consume] Router can consume: ${canConsume}`);

    if (!canConsume) {
        console.log(`[Consume] Cannot consume producer ${producerId} for user ${userId} - codec mismatch or producer not found`);
        return null;
    }

    const consumer = await participant.recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
    });

    console.log(`[Consume] Consumer created successfully!`);
    console.log(`[Consume] Consumer ID: ${consumer.id}`);
    console.log(`[Consume] Consumer kind: ${consumer.kind}`);
    console.log(`[Consume] Consumer paused: ${consumer.paused}`);
    console.log(`[Consume] Consumer closed: ${consumer.closed}`);

    participant.consumers.set(producerId, consumer);

    consumer.on('transportclose', () => {
        console.log(`[Consume] Consumer ${consumer.id} transport closed`);
        consumer.close();
    });

    consumer.on('producerclose', () => {
        console.log(`[Consume] Consumer ${consumer.id} producer closed`);
        participant.consumers.delete(producerId);
        consumer.close();
    });

    const rtpParams = consumer.rtpParameters;
    console.log(`[Consume] Consumer RTP Parameters:`, JSON.stringify(rtpParams, null, 2));
    console.log(`[Consume] Consumer ready to receive audio: ${consumer.id}`);

    return {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: rtpParams,
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

export function getOtherProducers(roomId: string, userId: string): Array<{ userId: string; producerId: string; paused: boolean }> {
    const room = rooms.get(roomId);
    if (!room) {
        return [];
    }

    const producers: Array<{ userId: string; producerId: string; paused: boolean }> = [];

    for (const [participantUserId, participant] of room.participants) {
        if (participantUserId !== userId && participant.producer && !participant.producer.closed) {
            producers.push({
                userId: participantUserId,
                producerId: participant.producer.id,
                paused: participant.producer.paused,
            });
        }
    }

    return producers;
}


//  * Get mute states for all participants in a room

export function getParticipantMuteStates(roomId: string): Map<string, boolean> {
    const room = rooms.get(roomId);
    const muteStates = new Map<string, boolean>();

    if (!room) {
        return muteStates;
    }

    for (const [userId, participant] of room.participants) {
        // If they have a producer, check if it's paused. If no producer yet, they're muted.
        const isMuted = !participant.producer || participant.producer.paused;
        muteStates.set(userId, isMuted);
    }

    return muteStates;
}


//  * Check if a specific user is muted

export function isParticipantMuted(roomId: string, userId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return true;

    const participant = room.participants.get(userId);
    if (!participant || !participant.producer) return true;

    return participant.producer.paused;
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
