import type { RoomSummary, Participant } from './room';
import type { RtpCapabilities, RtpParameters, DtlsParameters } from 'mediasoup/types';

// Client → Server Events
export interface ClientToServerEvents {
    // Hallway
    'hallway:subscribe': () => void;
    'hallway:unsubscribe': () => void;

    // Room
    'room:join': (roomId: string) => void;
    'room:leave': (roomId: string) => void;
    'room:mute': (muted: boolean) => void;

    // Voice (mediasoup signaling)
    'voice:get-rtp-capabilities': (callback: (caps: RtpCapabilities) => void) => void;
    'voice:create-transport': (
        direction: 'send' | 'recv',
        callback: (params: TransportParams) => void
    ) => void;
    'voice:connect-transport': (
        transportId: string,
        dtlsParameters: DtlsParameters,
        callback: () => void
    ) => void;
    'voice:produce': (
        transportId: string,
        rtpParameters: RtpParameters,
        callback: (producerId: string) => void
    ) => void;
    'voice:consume': (
        producerId: string,
        callback: (params: ConsumerParams | null) => void
    ) => void;
}

// Server → Client Events
export interface ServerToClientEvents {
    // Hallway
    'hallway:room-created': (room: RoomSummary) => void;
    'hallway:room-updated': (room: RoomSummary) => void;
    'hallway:room-closed': (roomId: string) => void;

    // Room
    'room:user-joined': (participant: Participant) => void;
    'room:user-left': (userId: string) => void;
    'room:user-muted': (userId: string, muted: boolean) => void;
    'room:user-kicked': (userId: string) => void;
    'room:owner-changed': (newOwnerId: string) => void;
    'room:closed': (reason: string) => void;
    'room:active-speaker': (userId: string | null) => void;

    // Voice
    'voice:new-producer': (userId: string, producerId: string) => void;
    'voice:producer-closed': (producerId: string) => void;

    // Errors
    error: (error: { code: string; message: string }) => void;
}

// mediasoup Transport Parameters
export interface TransportParams {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
}

// mediasoup Consumer Parameters
export interface ConsumerParams {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
    userId: string;
}
