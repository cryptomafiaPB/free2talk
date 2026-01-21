import type { RoomSummary, Participant } from './room.js';
import type { RtpCapabilities, RtpParameters, DtlsParameters } from 'mediasoup/types';
import type {
    RandomClientToServerEvents,
    RandomServerToClientEvents,
} from './random-call.js';

// Callback response types
export interface RoomJoinResponse {
    success: boolean;
    error?: string;
    /** Full list of current participants (sent on successful join) */
    participants?: Participant[];
    /** List of existing voice producers to consume (includes paused/muted state) */
    producers?: Array<{ userId: string; producerId: string; paused: boolean }>;
}

export interface RoomLeaveResponse {
    success: boolean;
    error?: string;
}

export interface RoomSyncResponse {
    success: boolean;
    error?: string;
    participants?: Participant[];
    producers?: Array<{ userId: string; producerId: string; paused: boolean }>;
}

// Client -> Server Events
export interface ClientToServerEvents extends RandomClientToServerEvents {
    // Hallway
    'hallway:subscribe': () => void;
    'hallway:unsubscribe': () => void;

    // Room (with acknowledgment callbacks)
    'room:join': (roomId: string, callback?: (response: RoomJoinResponse) => void) => void;
    'room:leave': (roomId: string, callback?: (response: RoomLeaveResponse) => void) => void;
    'room:sync': (roomId: string, callback?: (response: RoomSyncResponse) => void) => void;
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
        rtpCapabilities: RtpCapabilities,
        callback: (params: ConsumerParams | null) => void
    ) => void;
}

// Server -> Client Events
export interface ServerToClientEvents extends RandomServerToClientEvents {
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
    /** Full participant list broadcast for state reconciliation */
    'room:participants-updated': (data: { participants: Participant[]; reason: string }) => void;

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
