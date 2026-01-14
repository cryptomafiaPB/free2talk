/**
 * Voice Service
 * 
 * Core service for WebRTC voice communication using mediasoup.
 * Manages the full lifecycle of voice connections including:
 * - mediasoup Device initialization
 * - Transport creation and management (send/receive)
 * - Producer management (local audio)
 * - Consumer management (remote audio)
 * - Speaking detection
 * - Reconnection handling
 * 
 * This is a singleton service designed to be used across the application.
 */

import { Device } from 'mediasoup-client';
import type {
    Transport,
    Producer,
    Consumer,
    RtpCapabilities,
} from 'mediasoup-client/types';
import type { Socket } from 'socket.io-client';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    TransportParams,
    ConsumerParams,
} from '@free2talk/shared';

import { EventEmitter } from './event-emitter';
import { AudioLevelMonitor } from './audio-level-monitor';
import { MediaDevicesManager } from './media-devices';
import type {
    VoiceServiceConfig,
    VoiceServiceEvents,
    VoiceState,
    VoiceConnectionState,
    RemoteParticipant,
    AudioDeviceOptions,
} from './types';

type VoiceSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const DEFAULT_CONFIG: Required<VoiceServiceConfig> = {
    debug: false,
    audioConstraints: {},
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
};

/**
 * Main Voice Service class
 */
export class VoiceService extends EventEmitter<VoiceServiceEvents> {
    private config: Required<VoiceServiceConfig>;
    private socket: VoiceSocket | null = null;
    private device: Device | null = null;
    private sendTransport: Transport | null = null;
    private recvTransport: Transport | null = null;
    private producer: Producer | null = null;
    private consumers = new Map<string, Consumer>();
    private remoteParticipants = new Map<string, RemoteParticipant>();
    private audioElements = new Map<string, HTMLAudioElement>();
    private remoteAudioMonitors = new Map<string, AudioLevelMonitor>(); // Audio level monitors for remote participants

    private mediaDevices: MediaDevicesManager;
    private localAudioMonitor: AudioLevelMonitor;
    private localAudioTrack: MediaStreamTrack | null = null;

    private state: VoiceState;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(config?: VoiceServiceConfig) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.mediaDevices = new MediaDevicesManager();
        this.localAudioMonitor = new AudioLevelMonitor(
            // Industry standard noise gate: threshold of ~10% filters out background noise
            // This prevents the volume meter from showing activity when user isn't speaking
            { speakingThreshold: 0.10, updateInterval: 50 },
            {
                onVolumeChange: (volume) => {
                    this.updateState({ localAudioLevel: volume });
                },
                onSpeakingChange: (isSpeaking) => {
                    this.updateState({ isSpeaking });
                    this.emit('local-speaking', isSpeaking);
                },
            }
        );

        this.state = this.getInitialState();
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    /**
     * Initialize the voice service with a socket connection
     */
    async initialize(socket: VoiceSocket): Promise<void> {
        console.log('[VoiceService] initialize called - Socket ID:', socket.id, 'Connected:', socket.connected);
        this.log('Initializing voice service');
        this.log('Socket connected:', socket.connected, 'Socket ID:', socket.id);

        if (!socket.connected) {
            throw new Error('Cannot initialize voice service with disconnected socket');
        }

        // Clean up old socket listeners if reinitializing
        if (this.socket && this.socket !== socket) {
            console.log('[VoiceService] Reinitializing with new socket - Old ID:', this.socket.id, 'New ID:', socket.id);
            this.cleanupSocketListeners();
        }

        this.socket = socket;
        this.setupSocketListeners();
        console.log('[VoiceService] Initialized successfully - Stored socket ID:', this.socket.id);
    }

    /**
     * Join a voice room and start producing audio
     */
    async joinRoom(roomId: string): Promise<{ participants?: any[]; producers?: Array<{ userId: string; producerId: string }> }> {
        if (!this.socket) {
            throw new Error('Voice service not initialized. Call initialize() first.');
        }

        // Double-check socket is still connected
        if (!this.socket.connected) {
            console.error('[VoiceService] Socket disconnected before join. Socket ID:', this.socket.id, 'Connected:', this.socket.connected);
            throw new Error('Socket is not connected. Cannot join room.');
        }

        // Verify the socket is the same one that's globally managed
        const globalSocket = await import('@/lib/socket').then(m => m.getSocket());
        console.log('[VoiceService] joinRoom called - roomId:', roomId);
        console.log('[VoiceService] Stored socket ID:', this.socket.id, 'Connected:', this.socket.connected);
        console.log('[VoiceService] Global socket ID:', globalSocket.id, 'Connected:', globalSocket.connected);

        const sameSocket = this.socket === globalSocket;
        console.log('[VoiceService] Same socket?', sameSocket);

        // If the sockets are different, use the global connected socket instead
        if (!sameSocket && globalSocket.connected) {
            console.warn('[VoiceService] Socket mismatch detected! Reinitializing with global socket.');
            await this.initialize(globalSocket);
        }

        this.log('Socket state before join - connected:', this.socket.connected, 'id:', this.socket.id);

        if (this.state.currentRoomId === roomId) {
            this.log('Already in room', roomId);
            return {};
        }

        // Leave current room if in one
        if (this.state.currentRoomId) {
            await this.leaveRoom();
        }

        this.log('Joining room', roomId);
        this.updateState({ connectionState: 'connecting', isConnecting: true, error: null });

        try {
            // 1. Join room socket channel and get full state
            this.log('Emitting room:join event...');
            const joinResponse = await this.emitRoomJoin(roomId);
            this.log('room:join response:', joinResponse);

            // Update state with room ID
            this.updateState({ currentRoomId: roomId });

            // 2. Load device with RTP capabilities
            await this.loadDevice();

            // 3. Create transports
            await this.createSendTransport();
            await this.createRecvTransport();

            // 4. Get microphone access and start producing
            await this.startProducing();

            // 5. Consume existing producers from the response
            if (joinResponse.producers && joinResponse.producers.length > 0) {
                this.log(`Consuming ${joinResponse.producers.length} existing producers...`);
                for (const producer of joinResponse.producers) {
                    try {
                        await this.consumeProducer(producer.userId, producer.producerId);
                    } catch (err) {
                        this.log('Failed to consume producer:', producer.producerId, err);
                    }
                }
            }

            this.updateState({
                connectionState: 'connected',
                isConnecting: false,
                isConnected: true,
            });

            this.log('Successfully joined room', roomId);

            // Return the participants and producers for the UI to use
            return {
                participants: joinResponse.participants,
                producers: joinResponse.producers,
            };
        } catch (error) {
            this.log('Failed to join room:', error);
            this.updateState({
                connectionState: 'failed',
                isConnecting: false,
                isConnected: false,
                error: error instanceof Error ? error : new Error('Failed to join room'),
            });
            this.emit('error', error instanceof Error ? error : new Error('Failed to join room'));
            throw error;
        }
    }

    /**
     * Leave the current voice room
     */
    async leaveRoom(): Promise<void> {
        const roomId = this.state.currentRoomId;
        if (!roomId) {
            this.log('Not in a room');
            return;
        }

        this.log('Leaving room', roomId);

        try {
            // Notify server
            if (this.socket?.connected) {
                this.socket.emit('room:leave', roomId);
            }
        } catch (error) {
            this.log('Error leaving room:', error);
        }

        // Cleanup resources
        await this.cleanup();

        this.log('Left room', roomId);
    }

    /**
     * Mute/unmute local audio
     */
    async setMuted(muted: boolean): Promise<void> {
        this.log('Setting muted:', muted);

        if (this.producer) {
            if (muted) {
                await this.producer.pause();
            } else {
                await this.producer.resume();
            }
        }

        // Notify server
        if (this.socket?.connected && this.state.currentRoomId) {
            this.socket.emit('room:mute', muted);
        }

        this.updateState({ isMuted: muted });
        this.emit('mute-changed', muted);
    }

    /**
     * Toggle mute state
     */
    async toggleMute(): Promise<void> {
        await this.setMuted(!this.state.isMuted);
    }

    /**
     * Get available audio input devices
     */
    async getAudioDevices(): Promise<AudioDeviceOptions[]> {
        const devices = await this.mediaDevices.getAudioInputDevices();
        this.updateState({
            audioInputDevices: devices.map(d => ({
                deviceId: d.deviceId,
                kind: 'audioinput' as const,
                label: d.label,
                groupId: '',
                toJSON: () => ({}),
            }))
        });
        return devices;
    }

    /**
     * Switch audio input device
     */
    async switchAudioDevice(deviceId: string): Promise<void> {
        this.log('Switching audio device:', deviceId);

        // Get new track
        const newTrack = await this.mediaDevices.switchAudioDevice(deviceId);

        // Replace producer track if we have one
        if (this.producer && !this.producer.closed) {
            await this.producer.replaceTrack({ track: newTrack });
        }

        // Update local audio monitor
        this.localAudioMonitor.stop();
        await this.localAudioMonitor.start(newTrack);

        // Update state
        this.localAudioTrack = newTrack;
        this.updateState({
            localAudioTrack: newTrack,
            selectedAudioInputId: deviceId,
        });
    }

    /**
     * Get current state
     */
    getState(): VoiceState {
        return { ...this.state };
    }

    /**
     * Get remote participants
     */
    getRemoteParticipants(): RemoteParticipant[] {
        return Array.from(this.remoteParticipants.values());
    }

    /**
     * Check if connected to a room
     */
    isConnected(): boolean {
        return this.state.isConnected;
    }

    /**
     * Dispose of the service (cleanup everything)
     */
    async dispose(): Promise<void> {
        this.log('Disposing voice service');
        await this.cleanup();
        this.mediaDevices.dispose();
        this.removeAllListeners();
    }

    // ============================================================================
    // PRIVATE - DEVICE & TRANSPORT SETUP
    // ============================================================================

    /**
     * Load the mediasoup Device with RTP capabilities from the server
     */
    private async loadDevice(): Promise<void> {
        this.log('Loading mediasoup device');

        const rtpCapabilities = await this.getRtpCapabilities();

        if (!this.device) {
            this.device = new Device();
        }

        if (!this.device.loaded) {
            await this.device.load({ routerRtpCapabilities: rtpCapabilities });
            this.log('Device loaded');
        }
    }

    /**
     * Get RTP capabilities from the server
     */
    private getRtpCapabilities(): Promise<RtpCapabilities> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout getting RTP capabilities'));
            }, 10000);

            this.socket.emit('voice:get-rtp-capabilities', (caps) => {
                clearTimeout(timeout);
                if (caps) {
                    resolve(caps);
                } else {
                    reject(new Error('Failed to get RTP capabilities'));
                }
            });
        });
    }

    /**
     * Create the send (upload) transport
     */
    private async createSendTransport(): Promise<void> {
        this.log('Creating send transport');

        const transportParams = await this.createTransport('send');

        this.sendTransport = this.device!.createSendTransport({
            id: transportParams.id,
            iceParameters: transportParams.iceParameters,
            iceCandidates: transportParams.iceCandidates,
            dtlsParameters: transportParams.dtlsParameters,
        });

        // Handle transport connection
        this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            this.log('Send transport connecting');
            try {
                await this.connectTransport(transportParams.id, dtlsParameters);
                callback();
            } catch (error) {
                errback(error as Error);
            }
        });

        // Handle produce request
        this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            this.log('Send transport producing', kind);
            try {
                const producerId = await this.produce(transportParams.id, rtpParameters);
                callback({ id: producerId });
            } catch (error) {
                errback(error as Error);
            }
        });

        // Handle connection state changes
        this.sendTransport.on('connectionstatechange', (state) => {
            this.log('Send transport connection state:', state);
            if (state === 'failed' || state === 'closed') {
                this.handleTransportFailure('send');
            }
        });

        this.log('Send transport created');
    }

    /**
     * Create the receive (download) transport
     */
    private async createRecvTransport(): Promise<void> {
        this.log('Creating receive transport');

        const transportParams = await this.createTransport('recv');

        this.recvTransport = this.device!.createRecvTransport({
            id: transportParams.id,
            iceParameters: transportParams.iceParameters,
            iceCandidates: transportParams.iceCandidates,
            dtlsParameters: transportParams.dtlsParameters,
        });

        // Handle transport connection
        this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            this.log('Receive transport connecting');
            try {
                await this.connectTransport(transportParams.id, dtlsParameters);
                callback();
            } catch (error) {
                errback(error as Error);
            }
        });

        // Handle connection state changes
        this.recvTransport.on('connectionstatechange', (state) => {
            this.log('Receive transport connection state:', state);
            if (state === 'failed' || state === 'closed') {
                this.handleTransportFailure('recv');
            }
        });

        this.log('Receive transport created');
    }

    /**
     * Create a transport on the server
     */
    private createTransport(direction: 'send' | 'recv'): Promise<TransportParams> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error(`Timeout creating ${direction} transport`));
            }, 10000);

            this.socket.emit('voice:create-transport', direction, (params) => {
                clearTimeout(timeout);
                if (params) {
                    resolve(params);
                } else {
                    reject(new Error(`Failed to create ${direction} transport`));
                }
            });
        });
    }

    /**
     * Connect a transport on the server
     */
    private connectTransport(transportId: string, dtlsParameters: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout connecting transport'));
            }, 10000);

            this.socket.emit('voice:connect-transport', transportId, dtlsParameters, () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    // ============================================================================
    // PRIVATE - PRODUCER & CONSUMER MANAGEMENT
    // ============================================================================

    /**
     * Start producing local audio
     */
    private async startProducing(): Promise<void> {
        this.log('Starting audio production');

        if (!this.sendTransport) {
            throw new Error('Send transport not created');
        }

        // Get audio track
        const track = await this.mediaDevices.getAudioTrack({
            constraints: {
                echoCancellation: this.config.echoCancellation,
                noiseSuppression: this.config.noiseSuppression,
                autoGainControl: this.config.autoGainControl,
            },
        });

        this.localAudioTrack = track;
        this.updateState({ localAudioTrack: track });

        // Start audio level monitoring
        await this.localAudioMonitor.start(track);

        // Create producer
        this.producer = await this.sendTransport.produce({
            track,
            codecOptions: {
                opusStereo: true,
                opusDtx: true,
            },
        });

        this.producer.on('transportclose', () => {
            this.log('Producer transport closed');
            this.producer = null;
        });

        this.log('Producer created:', this.producer.id);
    }

    /**
     * Produce on the server (called by transport)
     */
    private produce(transportId: string, rtpParameters: any): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout producing'));
            }, 10000);

            this.socket.emit('voice:produce', transportId, rtpParameters, (producerId) => {
                clearTimeout(timeout);
                if (producerId) {
                    resolve(producerId);
                } else {
                    reject(new Error('Failed to produce'));
                }
            });
        });
    }

    /**
     * Consume a remote producer
     */
    private async consumeProducer(userId: string, producerId: string): Promise<void> {
        this.log('Consuming producer:', producerId, 'from user:', userId);

        if (!this.recvTransport || !this.device) {
            this.log('Cannot consume: transport or device not ready');
            return;
        }

        // Check if we can consume this producer
        const consumerParams = await this.getConsumerParams(producerId);
        if (!consumerParams) {
            this.log('Cannot consume producer:', producerId);
            return;
        }

        // Check if device can consume
        if (!this.device.rtpCapabilities) {
            this.log('Device RTP capabilities not loaded');
            return;
        }

        // Create consumer
        const consumer = await this.recvTransport.consume({
            id: consumerParams.id,
            producerId: consumerParams.producerId,
            kind: consumerParams.kind,
            rtpParameters: consumerParams.rtpParameters,
        });

        // Store consumer
        this.consumers.set(producerId, consumer);

        // Get audio track
        const audioTrack = consumer.track as MediaStreamTrack;

        // Create audio element for playback
        const audioElement = this.createAudioElement(producerId, audioTrack);

        // Create remote participant entry
        const remoteParticipant: RemoteParticipant = {
            id: consumerParams.id,
            oderId: userId,
            producerId,
            consumer,
            audioTrack,
            volume: 0,
            isSpeaking: false,
        };

        this.remoteParticipants.set(userId, remoteParticipant);

        // Create audio level monitor for this remote participant
        // Use same noise gate threshold as local audio for consistency
        const audioMonitor = new AudioLevelMonitor(
            { speakingThreshold: 0.10, updateInterval: 50 },
            {
                onVolumeChange: (volume) => {
                    const participant = this.remoteParticipants.get(userId);
                    if (participant) {
                        participant.volume = volume;
                        // Update state to trigger re-render
                        this.updateState({
                            remoteParticipants: new Map(this.remoteParticipants),
                        });
                    }
                },
                onSpeakingChange: (isSpeaking) => {
                    const participant = this.remoteParticipants.get(userId);
                    if (participant) {
                        participant.isSpeaking = isSpeaking;
                        this.updateState({
                            remoteParticipants: new Map(this.remoteParticipants),
                        });
                        this.emit('participant-speaking', userId, isSpeaking);
                    }
                },
            }
        );

        // Start monitoring the remote audio track
        try {
            await audioMonitor.start(audioTrack);
            this.remoteAudioMonitors.set(userId, audioMonitor);
            this.log('Started audio level monitoring for user:', userId);
        } catch (err) {
            this.log('Failed to start audio monitor for user:', userId, err);
        }

        this.updateState({
            remoteParticipants: new Map(this.remoteParticipants),
        });

        // Emit event
        this.emit('participant-joined', remoteParticipant);

        // Handle consumer events
        consumer.on('transportclose', () => {
            this.log('Consumer transport closed:', producerId);
            this.removeRemoteParticipant(userId);
        });

        this.log('Consumer created:', consumer.id);
    }

    /**
     * Get consumer parameters from server
     */
    private getConsumerParams(producerId: string): Promise<ConsumerParams | null> {
        return new Promise((resolve) => {
            if (!this.socket) {
                resolve(null);
                return;
            }

            const timeout = setTimeout(() => {
                this.log('Timeout getting consumer params');
                resolve(null);
            }, 10000);

            this.socket.emit('voice:consume', producerId, (params) => {
                clearTimeout(timeout);
                resolve(params);
            });
        });
    }

    /**
     * Create an audio element for playback
     */
    private createAudioElement(producerId: string, track: MediaStreamTrack): HTMLAudioElement {
        // Remove existing element if any
        this.removeAudioElement(producerId);

        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.srcObject = new MediaStream([track]);

        // Add to DOM (required for autoplay in some browsers)
        audio.style.display = 'none';
        document.body.appendChild(audio);

        // Play with error handling
        audio.play().catch((error) => {
            this.log('Audio playback error:', error);
            // Try again after user interaction
        });

        this.audioElements.set(producerId, audio);
        return audio;
    }

    /**
     * Remove an audio element
     */
    private removeAudioElement(producerId: string): void {
        const audio = this.audioElements.get(producerId);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            this.audioElements.delete(producerId);
        }
    }

    /**
     * Remove a remote participant
     */
    private removeRemoteParticipant(userId: string): void {
        const participant = this.remoteParticipants.get(userId);
        if (participant) {
            // Stop and remove audio level monitor
            const audioMonitor = this.remoteAudioMonitors.get(userId);
            if (audioMonitor) {
                audioMonitor.stop();
                this.remoteAudioMonitors.delete(userId);
            }

            // Close consumer
            if (!participant.consumer.closed) {
                participant.consumer.close();
            }

            // Remove audio element
            this.removeAudioElement(participant.producerId);

            // Remove from consumers map
            this.consumers.delete(participant.producerId);

            // Remove from participants
            this.remoteParticipants.delete(userId);

            // Update state
            this.updateState({
                remoteParticipants: new Map(this.remoteParticipants),
            });

            // Emit event
            this.emit('participant-left', userId);
        }
    }

    // ============================================================================
    // PRIVATE - SOCKET EVENT HANDLERS
    // ============================================================================

    /**
     * Setup socket event listeners
     */
    private setupSocketListeners(): void {
        if (!this.socket) return;

        // New producer in the room
        this.socket.on('voice:new-producer', async (userId, producerId) => {
            this.log('New producer:', userId, producerId);
            await this.consumeProducer(userId, producerId);
        });

        // Producer closed
        this.socket.on('voice:producer-closed', (producerId) => {
            this.log('Producer closed:', producerId);
            // Find and remove the participant
            for (const [userId, participant] of this.remoteParticipants) {
                if (participant.producerId === producerId) {
                    this.removeRemoteParticipant(userId);
                    break;
                }
            }
        });

        // User left room
        this.socket.on('room:user-left', (userId) => {
            this.log('User left:', userId);
            this.removeRemoteParticipant(userId);
        });

        // User muted/unmuted
        this.socket.on('room:user-muted', (userId, muted) => {
            this.log('User muted:', userId, muted);
            const participant = this.remoteParticipants.get(userId);
            if (participant) {
                // Visual indication only - audio is handled by producer pause/resume
            }
        });

        // Active speaker changed
        this.socket.on('room:active-speaker', (userId) => {
            this.log('Active speaker:', userId);
            // Update speaking states
            for (const [uid, participant] of this.remoteParticipants) {
                const wasSpeaking = participant.isSpeaking;
                participant.isSpeaking = uid === userId;
                if (wasSpeaking !== participant.isSpeaking) {
                    this.emit('participant-speaking', uid, participant.isSpeaking);
                }
            }
        });

        // Room closed
        this.socket.on('room:closed', async (reason) => {
            this.log('Room closed:', reason);
            await this.cleanup();
        });

        // Error
        this.socket.on('error', (error) => {
            this.log('Socket error:', error);
            this.emit('error', new Error(error.message));
        });

        // Disconnect
        this.socket.on('disconnect', () => {
            this.log('Socket disconnected');
            if (this.state.currentRoomId) {
                this.handleDisconnect();
            }
        });

        // Reconnect
        this.socket.on('connect', () => {
            this.log('Socket reconnected');
            if (this.state.connectionState === 'reconnecting') {
                this.handleReconnect();
            }
        });
    }

    // ============================================================================
    // PRIVATE - RECONNECTION HANDLING
    // ============================================================================

    /**
     * Cleanup socket event listeners (for reinitialization)
     */
    private cleanupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.off('voice:new-producer');
        this.socket.off('voice:producer-closed');
        this.socket.off('room:user-left');
        this.socket.off('room:user-muted');
        this.socket.off('room:active-speaker');
        this.socket.off('room:closed');
        this.socket.off('error');
        this.socket.off('disconnect');
        this.socket.off('connect');
    }

    /**
     * Handle socket disconnect
     */
    private handleDisconnect(): void {
        this.updateState({ connectionState: 'reconnecting' });
        this.emit('reconnecting');

        // Socket.io will handle reconnection automatically
        // We'll rejoin the room when it reconnects
    }

    /**
     * Handle socket reconnect
     */
    private async handleReconnect(): Promise<void> {
        const roomId = this.state.currentRoomId;
        if (!roomId) return;

        this.log('Attempting to rejoin room:', roomId);

        try {
            // Cleanup old resources
            await this.cleanupTransports();

            // Rejoin room
            await this.joinRoom(roomId);

            this.reconnectAttempts = 0;
            this.emit('reconnected');
        } catch (error) {
            this.log('Reconnection failed:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.updateState({ connectionState: 'failed' });
                this.emit('error', new Error('Failed to reconnect after multiple attempts'));
            }
        }
    }

    /**
     * Handle transport failure
     */
    private handleTransportFailure(type: 'send' | 'recv'): void {
        this.log(`${type} transport failed`);

        if (this.state.connectionState === 'connected') {
            this.handleDisconnect();
        }
    }

    // ============================================================================
    // PRIVATE - CLEANUP
    // ============================================================================

    /**
     * Cleanup all resources
     */
    private async cleanup(): Promise<void> {
        this.log('Cleaning up');

        // Clear reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Stop audio monitoring
        this.localAudioMonitor.stop();

        // Stop local audio track
        if (this.localAudioTrack) {
            this.localAudioTrack.stop();
            this.localAudioTrack = null;
        }

        // Stop media stream
        this.mediaDevices.stopCurrentStream();

        // Close producer
        if (this.producer && !this.producer.closed) {
            this.producer.close();
        }
        this.producer = null;

        // Remove all remote participants
        for (const userId of this.remoteParticipants.keys()) {
            this.removeRemoteParticipant(userId);
        }

        // Cleanup transports
        await this.cleanupTransports();

        // Reset state
        this.reconnectAttempts = 0;
        this.updateState(this.getInitialState());
    }

    /**
     * Cleanup transports only (for reconnection)
     */
    private async cleanupTransports(): Promise<void> {
        // Close consumers
        for (const consumer of this.consumers.values()) {
            if (!consumer.closed) {
                consumer.close();
            }
        }
        this.consumers.clear();

        // Close transports
        if (this.sendTransport && !this.sendTransport.closed) {
            this.sendTransport.close();
        }
        this.sendTransport = null;

        if (this.recvTransport && !this.recvTransport.closed) {
            this.recvTransport.close();
        }
        this.recvTransport = null;
    }

    // ============================================================================
    // PRIVATE - UTILITIES
    // ============================================================================

    /**
     * Get initial state
     */
    private getInitialState(): VoiceState {
        return {
            connectionState: 'disconnected',
            isConnecting: false,
            isConnected: false,
            isMuted: false,
            isSpeaking: false,
            localAudioLevel: 0,
            currentRoomId: null,
            localAudioTrack: null,
            remoteParticipants: new Map(),
            audioInputDevices: [],
            selectedAudioInputId: null,
            error: null,
        };
    }

    /**
     * Update state and emit change event
     */
    private updateState(partial: Partial<VoiceState>): void {
        const prevState = this.state;
        this.state = { ...this.state, ...partial };

        // Emit state change
        this.emit('state-changed', this.state);

        // Emit specific events
        if (prevState.connectionState !== this.state.connectionState) {
            this.emit('connection-state-changed', this.state.connectionState);
        }
    }

    /**
     * Emit room:join with proper response handling
     * Returns participants and existing producers for state synchronization
     */
    private emitRoomJoin(roomId: string): Promise<{
        success: boolean;
        participants?: any[];
        producers?: Array<{ userId: string; producerId: string }>;
    }> {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout joining room'));
            }, 15000);

            this.socket.emit('room:join', roomId, (response: any) => {
                clearTimeout(timeout);
                console.log('[VoiceService] room:join callback received:', response);

                if (response?.success === false) {
                    reject(new Error(response.error || 'Failed to join room'));
                } else {
                    resolve({
                        success: true,
                        participants: response?.participants || [],
                        producers: response?.producers || [],
                    });
                }
            });
        });
    }

    /**
     * Emit socket event with promise wrapper
     */
    private emitWithPromise<T>(event: string, ...args: any[]): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                console.error('[VoiceService] emitWithPromise: Socket is null');
                this.log('emitWithPromise: Socket is null');
                reject(new Error('Voice service not connected (socket is null)'));
                return;
            }

            if (!this.socket.connected) {
                console.error('[VoiceService] emitWithPromise: Socket exists but not connected. ID:', this.socket.id);
                this.log('emitWithPromise: Socket exists but not connected');
                reject(new Error('Voice service not connected (socket disconnected)'));
                return;
            }

            console.log(`[VoiceService] emitWithPromise: Emitting ${event} at ${new Date().toISOString()} - Socket ID: ${this.socket.id}, Args:`, args);
            this.log(`emitWithPromise: Emitting ${event} with args:`, args);
            this.log('emitWithPromise: Socket ID:', this.socket.id, 'Connected:', this.socket.connected);

            let resolved = false;

            const cleanup = () => {
                if (this.socket) {
                    this.socket.off('disconnect', onDisconnect);
                }
            };

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    this.log(`emitWithPromise: Timeout for ${event}`);
                    reject(new Error(`Timeout for event: ${event}`));
                }
            }, 10000);

            const onDisconnect = (reason: string) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    cleanup();
                    this.log(`emitWithPromise: Socket disconnected during ${event}, reason: ${reason}`);
                    reject(new Error(`Socket disconnected during ${event}: ${reason}`));
                }
            };

            this.socket.on('disconnect', onDisconnect);

            // All events now use callbacks
            (this.socket as any).emit(event, ...args, (result: T | { success: boolean; error?: string }) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    cleanup();
                    this.log(`emitWithPromise: Received callback for ${event}:`, result);
                    // Handle room:join and room:leave response format
                    if (event === 'room:join' || event === 'room:leave') {
                        const response = result as { success: boolean; error?: string };
                        if (response?.success === false) {
                            reject(new Error(response.error || `Failed: ${event}`));
                        } else {
                            resolve(undefined as T);
                        }
                    } else {
                        resolve(result as T);
                    }
                }
            });
        });
    }

    /**
     * Debug logging
     */
    private log(...args: any[]): void {
        if (this.config.debug) {
            console.log('[VoiceService]', ...args);
        }
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let voiceServiceInstance: VoiceService | null = null;

/**
 * Get the voice service singleton instance
 */
export function getVoiceService(config?: VoiceServiceConfig): VoiceService {
    if (!voiceServiceInstance) {
        voiceServiceInstance = new VoiceService(config);
    }
    return voiceServiceInstance;
}

/**
 * Reset the voice service singleton (useful for testing)
 */
export async function resetVoiceService(): Promise<void> {
    if (voiceServiceInstance) {
        await voiceServiceInstance.dispose();
        voiceServiceInstance = null;
    }
}
