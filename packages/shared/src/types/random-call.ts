/**
 * Random Call Types
 * 
 * P2P-based random voice call feature types
 * for instant matching and direct peer-to-peer connections.
 */

// ---------------------- Core Types 

export interface RandomCallPreferences {
    // Selected languages for preference matching (optional)
    languages?: string[];
    // Whether language preference is enabled
    preferenceEnabled: boolean;
}

export interface RandomCallPartner {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface RandomCallSession {
    sessionId: string;
    partnerId: string;
    partnerInfo: RandomCallPartner;
    // Whether this client should initiate the WebRTC offer
    isInitiator: boolean;
    // Language matched (null = random global match)
    matchedLanguage?: string | null;
}

export interface RandomCallStats {
    // Total users currently in the random call feature
    totalActive: number;
    // Users waiting in queue for a match
    inQueue: number;
    // Number of active ongoing calls
    activeCalls: number;
    // Timestamp of last update
    lastUpdate: number;
}

export type RandomCallState =
    | 'idle'           // Not in queue
    | 'queued'         // Waiting for match
    | 'connecting'     // Match found, establishing P2P
    | 'connected'      // Active call
    | 'ended';         // Call ended

export interface RandomCallEndReason {
    reason: 'next_clicked' | 'partner_left' | 'timeout' | 'error' | 'user_cancelled';
    message?: string;
}

// ---------------------- WebRTC Signaling Types 

export interface RTCIceCandidateInit {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string | null;
}

export interface RTCSessionDescriptionInit {
    type: RTCSdpType;
    sdp: string;
}

export type RTCSdpType = 'answer' | 'offer' | 'pranswer' | 'rollback';

// ---------------------- Callback Response Types 

export interface RandomQueueResponse {
    success: boolean;
    error?: string;
    // Current position info
    position?: number;
    // Current stats
    stats?: RandomCallStats;
}

export interface RandomEndCallResponse {
    success: boolean;
    error?: string;
}

// ---------------------- Socket Event Payloads 

// Payload for random:start_queue event
export interface RandomStartQueuePayload {
    // Optional language preferences
    preferences?: RandomCallPreferences;
}

// Payload for random:match_instant event
export interface RandomMatchInstantPayload extends RandomCallSession { }

// Payload for random:ice_candidate event (both directions)
export interface RandomIceCandidatePayload {
    sessionId: string;
    candidate: RTCIceCandidateInit;
}

// Payload for random:offer event (both directions)
export interface RandomOfferPayload {
    sessionId: string;
    offer: RTCSessionDescriptionInit;
}

// Payload for random:answer event (both directions)
export interface RandomAnswerPayload {
    sessionId: string;
    answer: RTCSessionDescriptionInit;
}

/// Payload for random:end_call event
export interface RandomEndCallPayload {
    sessionId: string;
    rating?: 1 | 2 | 3 | 4 | 5;
}

// Payload for random:next_partner event
export interface RandomNextPartnerPayload {
    sessionId: string;
}

// Payload for random:report_user event
export interface RandomReportUserPayload {
    sessionId: string;
    reason: string;
    details?: string;
}

// --------------------- Client -> Server Events 

export interface RandomClientToServerEvents {
    // Join the random matching queue
    'random:start_queue': (
        payload: RandomStartQueuePayload,
        callback?: (response: RandomQueueResponse) => void
    ) => void;

    // Leave the random matching queue
    'random:cancel_queue': (callback?: (response: { success: boolean }) => void) => void;

    // Send ICE candidate to peer (via signaling server)
    'random:ice_candidate': (payload: RandomIceCandidatePayload) => void;

    // Send WebRTC offer to peer
    'random:offer': (payload: RandomOfferPayload) => void;

    // Send WebRTC answer to peer
    'random:answer': (payload: RandomAnswerPayload) => void;

    // Skip current partner and find next
    'random:next_partner': (
        payload: RandomNextPartnerPayload,
        callback?: (response: RandomQueueResponse) => void
    ) => void;

    // End the current call
    'random:end_call': (
        payload: RandomEndCallPayload,
        callback?: (response: RandomEndCallResponse) => void
    ) => void;

    // Report a user for inappropriate behavior
    'random:report_user': (
        payload: RandomReportUserPayload,
        callback?: (response: { success: boolean }) => void
    ) => void;

    // Subscribe to stats updates
    'random:subscribe_stats': () => void;

    // Unsubscribe from stats updates
    'random:unsubscribe_stats': () => void;
}

// --------------------- Server -> Client Events 

export interface RandomServerToClientEvents {
    // Match found - immediately start P2P connection
    'random:match_instant': (payload: RandomMatchInstantPayload) => void;

    // Forward ICE candidate from peer
    'random:ice_candidate': (payload: { candidate: RTCIceCandidateInit }) => void;

    // Forward WebRTC offer from peer
    'random:offer': (payload: { offer: RTCSessionDescriptionInit }) => void;

    // Forward WebRTC answer from peer
    'random:answer': (payload: { answer: RTCSessionDescriptionInit }) => void;

    // Partner disconnected
    'random:partner_disconnected': () => void;

    // Call ended
    'random:call_ended': (payload: RandomCallEndReason) => void;

    // Connection timeout - failed to establish P2P
    'random:connection_timeout': () => void;

    // Realtime stats update
    'random:stats_update': (stats: RandomCallStats) => void;

    // User was reported and action taken
    'random:reported': (payload: { reason: string }) => void;

    // Queue position update
    'random:queue_position': (position: number) => void;
}
