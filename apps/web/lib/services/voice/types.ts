/**
 * Voice Service Types
 * 
 * Type definitions for the voice/WebRTC layer of the application.
 * Separated from implementation for clean imports and better maintainability.
 */

import type { Device, Transport, Producer, Consumer } from 'mediasoup-client/types';
import type { RtpCapabilities, RtpParameters, DtlsParameters } from 'mediasoup-client/types';

// Re-export mediasoup types for convenience
export type { RtpCapabilities, RtpParameters, DtlsParameters };

/**
 * Transport parameters received from the server
 */
export interface TransportParams {
    id: string;
    iceParameters: Record<string, unknown>;
    iceCandidates: unknown[];
    dtlsParameters: DtlsParameters;
}

/**
 * Consumer parameters received from the server
 */
export interface ConsumerParams {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
    userId: string;
}

/**
 * Remote participant with their consumer
 */
export interface RemoteParticipant {
    id: string;
    oderId: string;  // TODO: Fix typo to peerId
    producerId: string;
    consumer: Consumer;
    audioTrack: MediaStreamTrack | null;
    volume: number;
    isSpeaking: boolean;
}

/**
 * Voice connection state
 */
export type VoiceConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'failed';

/**
 * Voice service configuration
 */
export interface VoiceServiceConfig {
    /** Enable debug logging */
    debug?: boolean;
    /** Audio constraints for getUserMedia */
    audioConstraints?: MediaTrackConstraints;
    /** Auto-gain control */
    autoGainControl?: boolean;
    /** Echo cancellation */
    echoCancellation?: boolean;
    /** Noise suppression */
    noiseSuppression?: boolean;
}

/**
 * Voice service state
 */
export interface VoiceState {
    connectionState: VoiceConnectionState;
    isConnecting: boolean;
    isConnected: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
    localAudioLevel: number; // Audio level for local user (0-1)
    currentRoomId: string | null;
    localAudioTrack: MediaStreamTrack | null;
    remoteParticipants: Map<string, RemoteParticipant>;
    audioInputDevices: MediaDeviceInfo[];
    selectedAudioInputId: string | null;
    error: Error | null;
}

/**
 * Voice service event types
 */
export interface VoiceServiceEvents {
    [key: string]: (...args: any[]) => void;
    'state-changed': (state: VoiceState) => void;
    'connection-state-changed': (state: VoiceConnectionState) => void;
    'participant-joined': (participant: RemoteParticipant) => void;
    'participant-left': (userId: string) => void;
    'participant-speaking': (userId: string, isSpeaking: boolean) => void;
    'local-speaking': (isSpeaking: boolean) => void;
    'mute-changed': (isMuted: boolean) => void;
    'error': (error: Error) => void;
    'reconnecting': () => void;
    'reconnected': () => void;
}

/**
 * Event emitter interface for voice service
 */
export interface VoiceServiceEventEmitter {
    on<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): void;
    off<K extends keyof VoiceServiceEvents>(event: K, listener: VoiceServiceEvents[K]): void;
    emit<K extends keyof VoiceServiceEvents>(event: K, ...args: Parameters<VoiceServiceEvents[K]>): void;
}

/**
 * Audio level data for speaking detection
 */
export interface AudioLevelData {
    userId: string;
    level: number;
    isSpeaking: boolean;
}

/**
 * Device selection options
 */
export interface AudioDeviceOptions {
    deviceId: string;
    label: string;
    isDefault: boolean;
}
