/**
 * Room Components
 * 
 * Centralized exports for all room-related components.
 */

// Types
export * from './types';

// Components
export { ParticipantTile, EmptySlot } from './participant-tile';
export { ParticipantsGrid } from './participants-grid';
export { AudioControls } from './audio-controls';
export { RoomHeader } from './room-header';
export { DeviceSelector } from './device-selector';
export { VoiceRoom } from './voice-room';
export { EnhancedVoiceRoom } from './enhanced-voice-room';

// New redesigned components
export { ParticipantDock } from './participant-dock';
export { RoomControlBar, BottomControlBar } from './room-control-bar';
export { VoiceRoomLayout } from './voice-room-layout';
