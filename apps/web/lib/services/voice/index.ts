/**
 * Voice Service Module
 * 
 * Provides WebRTC voice communication capabilities using mediasoup.
 * 
 * @example
 * ```ts
 * import { getVoiceService, useVoice } from '@/lib/services/voice';
 * 
 * // In a component
 * const voice = useVoice();
 * await voice.joinRoom(roomId);
 * ```
 */

// Main service
export { VoiceService, getVoiceService, resetVoiceService } from './voice-service';

// Supporting classes
export { MediaDevicesManager, getMediaDevicesManager } from './media-devices';
export { AudioLevelMonitor, getAudioLevel } from './audio-level-monitor';
export { EventEmitter } from './event-emitter';

// React hooks and provider
export {
    VoiceProvider,
    useVoice,
    useVoiceConnection,
    useVoiceMute,
    useRemoteParticipants,
    useRemoteParticipant,
    useAudioDevices,
    useVoiceEvent,
    useOnSpeaking,
    useLocalSpeaking,
} from './hooks';

// Types
export type {
    VoiceServiceConfig,
    VoiceServiceEvents,
    VoiceState,
    VoiceConnectionState,
    RemoteParticipant,
    TransportParams,
    ConsumerParams,
    AudioLevelData,
    AudioDeviceOptions,
} from './types';
