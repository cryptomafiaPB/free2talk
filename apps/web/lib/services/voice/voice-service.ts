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
    private recvTransportConnected = false; // Track if recv transport is connected
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

            // 🔧 FIX #2: Setup socket listeners BEFORE producing
            // This ensures listeners are ready when voice:new-producer events are broadcast
            this.setupSocketListeners();

            // 4. Get microphone access and start producing
            await this.startProducing();

            // 5. Consume existing producers from the response
            if (joinResponse.producers && joinResponse.producers.length > 0) {
                console.log(`[VoiceService] Consuming ${joinResponse.producers.length} existing producers from join response...`);
                for (const producer of joinResponse.producers) {
                    console.log('[VoiceService] Attempting to consume existing producer:', producer);
                    try {
                        await this.consumeProducer(producer.userId, producer.producerId);
                        console.log('[VoiceService] ✅ Successfully consumed existing producer:', producer.producerId);
                    } catch (err) {
                        console.error('[VoiceService] ❌ Failed to consume existing producer:', producer.producerId, err);
                    }
                }
            } else {
                console.log('[VoiceService] No existing producers to consume');
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
        console.log('[VoiceService] 📤 Creating SEND transport...');
        this.log('Creating send transport');

        const transportParams = await this.createTransport('send');
        console.log('[VoiceService] Received transport params for send transport:', transportParams.id);

        this.sendTransport = this.device!.createSendTransport({
            id: transportParams.id,
            iceParameters: transportParams.iceParameters,
            iceCandidates: transportParams.iceCandidates,
            dtlsParameters: transportParams.dtlsParameters,
        });

        console.log('[VoiceService] ✅ Send transport object created');

        // Handle transport connection
        this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            console.log('[VoiceService] 🔗 SEND transport connect event fired - connecting DTLS');
            console.log('[VoiceService] Send transport ID:', transportParams.id);
            console.log('[VoiceService] DTLS params:', dtlsParameters);
            this.log('Send transport connecting');
            try {
                console.log('[VoiceService] Calling connectTransport for send transport...');
                const result = await this.connectTransport(transportParams.id, dtlsParameters);
                console.log('[VoiceService] ✅ SEND transport DTLS connected successfully!', result);
                console.log('[VoiceService] Calling callback() to confirm connection');
                callback();
                console.log('[VoiceService] Callback completed successfully');
            } catch (error) {
                console.error('[VoiceService] ❌ Failed to connect send transport:', error);
                console.error('[VoiceService] Error details:', error instanceof Error ? error.message : String(error));
                if (errback) {
                    errback(error as Error);
                }
            }
        });

        // Handle produce request
        this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            console.log('[VoiceService] 🎤 PRODUCE event from sendTransport - kind:', kind);
            this.log('Send transport producing', kind);
            try {
                const producerId = await this.produce(transportParams.id, rtpParameters);
                console.log('[VoiceService] ✅ Producer created via send transport:', producerId);
                callback({ id: producerId });
            } catch (error) {
                console.error('[VoiceService] ❌ Failed to produce on send transport:', error);
                errback(error as Error);
            }
        });

        // Handle connection state changes
        this.sendTransport.on('connectionstatechange', (state) => {
            console.log('[VoiceService] Send transport connection state changed:', state);
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

        // Handle transport connection - CRITICAL: This callback is called when the first consumer is created
        this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            console.log('[VoiceService] Receive transport connect event fired - connecting DTLS');
            this.log('Receive transport connecting');
            try {
                await this.connectTransport(transportParams.id, dtlsParameters);
                this.recvTransportConnected = true;
                console.log('[VoiceService] Receive transport DTLS connected successfully');
                callback();
            } catch (error) {
                console.error('[VoiceService] Failed to connect recv transport:', error);
                this.recvTransportConnected = false;
                errback(error as Error);
            }
        });

        // Handle connection state changes
        this.recvTransport.on('connectionstatechange', (state) => {
            console.log('[VoiceService] Receive transport connection state changed:', state);
            this.log('Receive transport connection state:', state);
            this.recvTransportConnected = state === 'connected';
            if (state === 'failed' || state === 'closed') {
                this.handleTransportFailure('recv');
            }
        });

        // 🔧 FIX #3: Proactively ensure recv transport connects
        // The 'connect' event above only fires when the first consumer is created.
        // If no producers exist initially, this never fires, causing issues when
        // new producers arrive later. We need to ensure connection is ready.
        // This polls for connection state and doesn't interfere with normal flow.
        setTimeout(() => {
            if (!this.recvTransportConnected && this.recvTransport && !this.recvTransport.closed) {
                console.log('[VoiceService] 🔧 Proactively checking recv transport connection state...');
                const connectionState = this.recvTransport.connectionState;
                console.log('[VoiceService] Recv transport connection state:', connectionState);
                // The actual connection will happen when first consumer tries to connect
                // This is just a sanity check to ensure the transport is in a good state
                if (connectionState !== 'connected' && connectionState !== 'connecting') {
                    console.log('[VoiceService] Note: Recv transport will connect when first consumer is created');
                }
            }
        }, 500);

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
                console.error('[VoiceService] Socket not connected for connectTransport');
                reject(new Error('Socket not connected'));
                return;
            }

            console.log('[VoiceService] Emitting voice:connect-transport for transport:', transportId);
            const timeout = setTimeout(() => {
                console.error('[VoiceService] Timeout (10s) waiting for transport connection ack');
                reject(new Error('Timeout connecting transport'));
            }, 10000);

            this.socket.emit('voice:connect-transport', transportId, dtlsParameters, () => {
                console.log('[VoiceService] ✅ Server acked transport connection for:', transportId);
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
        console.log('[VoiceService] 🎙️ startProducing() called');
        this.log('Starting audio production');

        if (!this.sendTransport) {
            console.error('[VoiceService] ❌ Send transport not created!');
            throw new Error('Send transport not created');
        }

        try {
            // Get audio track
            console.log('[VoiceService] 📱 Requesting microphone access with constraints:', {
                echoCancellation: this.config.echoCancellation,
                noiseSuppression: this.config.noiseSuppression,
                autoGainControl: this.config.autoGainControl,
            });

            const track = await this.mediaDevices.getAudioTrack({
                constraints: {
                    echoCancellation: this.config.echoCancellation,
                    noiseSuppression: this.config.noiseSuppression,
                    autoGainControl: this.config.autoGainControl,
                },
            });

            console.log('[VoiceService] ✅ Microphone access granted');
            console.log('[VoiceService] Audio track details:', {
                id: track.id,
                kind: track.kind,
                readyState: track.readyState,
                enabled: track.enabled,
                muted: track.muted,
            });

            this.localAudioTrack = track;
            this.updateState({ localAudioTrack: track });

            // Start audio level monitoring
            console.log('[VoiceService] 📊 Starting audio level monitoring...');
            await this.localAudioMonitor.start(track);
            console.log('[VoiceService] ✅ Audio level monitoring started');

            // Create producer - the connect event will fire automatically during produce()
            console.log('[VoiceService] 🎤 Creating producer with track:', track.id);
            console.log('[VoiceService] Current send transport state:', this.sendTransport.connectionState);

            this.producer = await this.sendTransport.produce({
                track,
                codecOptions: {
                    opusStereo: true,
                    opusDtx: true,
                },
            });

            console.log('[VoiceService] ✅✅✅ Producer created successfully!');
            console.log('[VoiceService] Producer details:', {
                id: this.producer.id,
                kind: this.producer.kind,
                paused: this.producer.paused,
                closed: this.producer.closed,
                trackId: this.producer.track?.id,
            });

            // CRITICAL: Resume producer if paused to ensure audio encoding/transmission
            if (this.producer.paused) {
                console.log('[VoiceService] 🔴 Producer is PAUSED! Resuming now...');
                try {
                    await this.producer.resume();
                    console.log('[VoiceService] ✅ Producer resumed successfully');
                } catch (error) {
                    console.error('[VoiceService] ❌ Failed to resume producer:', error);
                }
            } else {
                console.log('[VoiceService] Producer is not paused (paused=false), proceeding with monitoring');
            }

            // Check if we can access the underlying RTC sender
            try {
                const sender = (this.producer as any)._sender;
                if (sender) {
                    console.log('[VoiceService] ✅ Producer has RTCRtpSender:', sender);
                    // Check if track is enabled
                    const track = sender.track;
                    if (track) {
                        console.log('[VoiceService] RTCRtpSender track state:', {
                            id: track.id,
                            kind: track.kind,
                            enabled: track.enabled,
                            readyState: track.readyState,
                            muted: track.muted,
                        });
                    } else {
                        console.warn('[VoiceService] ⚠️ RTCRtpSender has NO track!');
                    }
                } else {
                    console.warn('[VoiceService] ⚠️⚠️⚠️ Producer has NO _sender property! Audio encoding may not work!');
                }
            } catch (e) {
                console.error('[VoiceService] Error checking sender:', e);
            }

            this.producer.on('transportclose', () => {
                console.log('[VoiceService] Producer transport closed');
                this.log('Producer transport closed');
                this.producer = null;
            });

            this.log('Producer created:', this.producer.id);

            // Start monitoring outgoing RTP stats to verify audio is being sent
            this.startSendRtpStatsMonitoring(this.producer.id);
        } catch (error) {
            console.error('[VoiceService] ❌ FATAL ERROR in startProducing():', error);
            console.error('[VoiceService] Error details:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Produce on the server (called by transport)
     */
    private produce(transportId: string, rtpParameters: any): Promise<string> {
        console.log('[VoiceService] 📡 produce() called - sending RTP params to server');
        console.log('[VoiceService] Transport ID:', transportId);
        console.log('[VoiceService] RTP Parameters:', {
            mid: rtpParameters.mid,
            codecs: rtpParameters.codecs?.length,
            encodings: rtpParameters.encodings?.length,
        });

        return new Promise((resolve, reject) => {
            if (!this.socket) {
                console.error('[VoiceService] ❌ Socket not connected in produce()');
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                console.error('[VoiceService] ❌ Timeout waiting for producer ID from server');
                reject(new Error('Timeout producing'));
            }, 10000);

            this.socket.emit('voice:produce', transportId, rtpParameters, (producerId) => {
                clearTimeout(timeout);
                if (producerId) {
                    console.log('[VoiceService] ✅ Server confirmed producer created with ID:', producerId);
                    resolve(producerId);
                } else {
                    console.error('[VoiceService] ❌ Server returned null/empty producer ID');
                    reject(new Error('Failed to produce'));
                }
            });
        });
    }

    /**
     * Consume a remote producer
     */
    private async consumeProducer(userId: string, producerId: string): Promise<void> {
        console.log('[VoiceService] 🎧 consumeProducer called - userId:', userId, 'producerId:', producerId);

        try {
            this.log('🎧 Attempting to consume producer:', producerId, 'from user:', userId);

            if (!this.recvTransport || !this.device) {
                console.error('[VoiceService] Cannot consume: transport or device not ready', {
                    hasRecvTransport: !!this.recvTransport,
                    hasDevice: !!this.device,
                    producerId,
                    userId
                });
                return;
            }

            // Check if we can consume this producer
            const consumerParams = await this.getConsumerParams(producerId);
            if (!consumerParams) {
                console.error('[VoiceService] Failed to get consumer params for producer:', producerId, 'from user:', userId);
                return;
            }

            // Check if device can consume
            if (!this.device.rtpCapabilities) {
                console.error('[VoiceService] Device RTP capabilities not loaded');
                return;
            }

            // CRITICAL FIX: Ensure recv transport connects on first consumer
            // The first consume() call triggers the 'connect' event asynchronously
            // We need to create the consumer but then wait for connection to complete
            console.log('[VoiceService] Recv transport connected state before consume:', this.recvTransportConnected);

            // Set up a promise that resolves when transport connects
            let connectionPromise: Promise<void> | null = null;
            if (!this.recvTransportConnected) {
                connectionPromise = new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Recv transport connection timeout'));
                    }, 5000);

                    // Poll for connection state
                    const checkConnection = () => {
                        if (this.recvTransportConnected) {
                            clearTimeout(timeout);
                            resolve();
                        } else {
                            setTimeout(checkConnection, 50);
                        }
                    };
                    checkConnection();
                });
            }

            // Create consumer (this triggers recv transport 'connect' event on first call)
            const consumer = await this.recvTransport.consume({
                id: consumerParams.id,
                producerId: consumerParams.producerId,
                kind: consumerParams.kind,
                rtpParameters: consumerParams.rtpParameters,
            });

            // Now wait for the connection to actually complete
            if (connectionPromise) {
                console.log('[VoiceService] Waiting for recv transport DTLS connection to complete...');
                try {
                    await connectionPromise;
                    console.log('[VoiceService] ✅ Recv transport connected successfully, consumer ready to receive media');
                } catch (error) {
                    console.error('[VoiceService] ❌ Recv transport connection failed:', error);
                    console.error('[VoiceService] Consumer may not receive media properly!');
                    // Continue anyway - consumer might still work
                }
            } else {
                console.log('[VoiceService] Recv transport already connected, consumer ready immediately');
            }

            console.log('[VoiceService] Consumer created successfully:', consumer.id);
            console.log('[VoiceService] Consumer kind:', consumer.kind);
            console.log('[VoiceService] Consumer paused:', consumer.paused);
            console.log('[VoiceService] Consumer closed:', consumer.closed);

            // Ensure consumer is not paused (mediasoup default is paused=false but verify)
            if (consumer.paused) {
                console.log('[VoiceService] Consumer was paused, resuming:', consumer.id);
                await consumer.resume();
                console.log('[VoiceService] Consumer resumed successfully');
            }

            // Store consumer
            this.consumers.set(producerId, consumer);
            console.log('[VoiceService] Consumer stored in map, total consumers:', this.consumers.size);

            // Get audio track
            const audioTrack = consumer.track as MediaStreamTrack;
            console.log('[VoiceService] Got audio track from consumer:', audioTrack.id);
            console.log('[VoiceService] Track readyState:', audioTrack.readyState);
            console.log('[VoiceService] Track enabled:', audioTrack.enabled);
            console.log('[VoiceService] Track muted:', audioTrack.muted);

            // Verify track is active
            if (audioTrack.readyState !== 'live') {
                console.warn('[VoiceService] ⚠️ Audio track not live:', audioTrack.readyState);
            } else {
                console.log('[VoiceService] ✅ Audio track is LIVE:', audioTrack.id, 'from producer:', producerId);
            }

            // Create audio element for playback
            console.log('[VoiceService] Creating audio element for producer:', producerId);
            const audioElement = this.createAudioElement(producerId, audioTrack);
            console.log('[VoiceService] ✅ Audio element created and attached to DOM');

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

            console.log('[VoiceService] ✅✅✅ Consumer setup COMPLETE for user:', userId, 'producer:', producerId);
            this.log('Consumer created:', consumer.id);

            // Start monitoring RTP stats to verify audio is actually flowing
            this.startRtpStatsMonitoring(consumer.id, userId, producerId);

        } catch (error) {
            console.error('[VoiceService] ❌❌❌ FATAL ERROR in consumeProducer:', error);
            console.error('[VoiceService] Error details:', {
                userId,
                producerId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
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

            // Get device RTP capabilities - required for server to check compatibility
            if (!this.device || !this.device.rtpCapabilities) {
                this.log('Cannot get consumer params: device not loaded');
                resolve(null);
                return;
            }

            const timeout = setTimeout(() => {
                this.log('Timeout getting consumer params');
                resolve(null);
            }, 10000);

            // Send both producerId AND our device's RTP capabilities
            this.socket.emit('voice:consume', producerId, this.device.rtpCapabilities, (params) => {
                clearTimeout(timeout);
                resolve(params);
            });
        });
    }

    /**
     * Create an audio element for playback
     */
    private createAudioElement(producerId: string, track: MediaStreamTrack): HTMLAudioElement {
        console.log('[VoiceService] createAudioElement called for producer:', producerId);
        console.log('[VoiceService] Track details - ID:', track.id, 'kind:', track.kind, 'readyState:', track.readyState);

        // Remove existing element if any
        this.removeAudioElement(producerId);

        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.volume = 1.0; // Ensure full volume
        audio.srcObject = new MediaStream([track]);

        console.log('[VoiceService] Audio element created, autoplay:', audio.autoplay, 'volume:', audio.volume);

        // Add to DOM (required for autoplay in some browsers)
        audio.style.display = 'none';
        document.body.appendChild(audio);
        console.log('[VoiceService] Audio element appended to DOM');

        // Play with robust error handling and retry
        const attemptPlay = async () => {
            console.log('[VoiceService] Attempting to play audio element...');
            try {
                await audio.play();
                console.log('[VoiceService] ✅ Audio element playing successfully for producer:', producerId);
            } catch (error) {
                console.warn('[VoiceService] Audio playback blocked, attempting unmute workaround:', error);
                // Common workaround: mute, play, then unmute
                try {
                    audio.muted = true;
                    await audio.play();
                    audio.muted = false;
                    console.log('[VoiceService] ✅ Audio playback successful after unmute workaround for producer:', producerId);
                } catch (retryError) {
                    console.error('[VoiceService] ❌ Failed to play audio for producer', producerId, retryError);
                    // Last resort: wait for user interaction
                    const playOnInteraction = async () => {
                        console.log('[VoiceService] User interaction detected, resuming audio...');
                        try {
                            audio.muted = true;
                            await audio.play();
                            audio.muted = false;
                            console.log('[VoiceService] ✅ Audio resumed after user interaction for producer:', producerId);
                            document.removeEventListener('click', playOnInteraction);
                            document.removeEventListener('touchstart', playOnInteraction);
                        } catch (e) {
                            console.error('[VoiceService] ❌ Still failed after user interaction:', e);
                        }
                    };
                    console.log('[VoiceService] Waiting for user interaction to play audio...');
                    document.addEventListener('click', playOnInteraction, { once: true });
                    document.addEventListener('touchstart', playOnInteraction, { once: true });
                }
            }
        };

        attemptPlay();

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

    /**
     * Monitor RTP stats for incoming audio to verify data is being received
     */
    private startRtpStatsMonitoring(consumerId: string, userId: string, producerId: string): void {
        let previousStats = {
            bytesReceived: 0,
            packetsReceived: 0,
            jitterBufferDelay: 0,
            audioLevel: 0,
        };

        let checkCount = 0;
        const maxChecks = 20; // Check for 20 seconds (1 check per second)

        const checkStats = async () => {
            checkCount++;

            try {
                // Get WebRTC connection stats
                const stats = await this.recvTransport.getStats();

                let inboundRtpStats: any = null;
                stats.forEach((report) => {
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                        inboundRtpStats = report;
                    }
                });

                if (inboundRtpStats) {
                    const bytesReceived = inboundRtpStats.bytesReceived || 0;
                    const packetsReceived = inboundRtpStats.packetsReceived || 0;
                    const audioLevel = inboundRtpStats.audioLevel || 0;
                    const jitterBufferDelay = inboundRtpStats.jitterBufferDelay || 0;

                    const bytesReceivedDelta = bytesReceived - previousStats.bytesReceived;
                    const packetsReceivedDelta = packetsReceived - previousStats.packetsReceived;

                    console.log(`[VoiceService RTP] Check #${checkCount} for ${userId} (Producer: ${producerId})`);
                    console.log(`[VoiceService RTP] Bytes received: ${bytesReceived} (Δ ${bytesReceivedDelta})`);
                    console.log(`[VoiceService RTP] Packets received: ${packetsReceived} (Δ ${packetsReceivedDelta})`);
                    console.log(`[VoiceService RTP] Audio level: ${audioLevel}`);
                    console.log(`[VoiceService RTP] Jitter buffer delay: ${jitterBufferDelay}ms`);

                    if (bytesReceivedDelta === 0 && checkCount > 2) {
                        console.warn(`[VoiceService RTP] ⚠️ NO RTP DATA RECEIVED! No bytes received in last second`);
                    } else if (bytesReceivedDelta > 0) {
                        console.log(`[VoiceService RTP] ✅ RTP DATA FLOWING: ${bytesReceivedDelta} bytes received in last second`);
                    }

                    if (audioLevel > 0) {
                        console.log(`[VoiceService RTP] ✅ AUDIO DETECTED: Audio level = ${audioLevel}`);
                    } else if (checkCount > 5) {
                        console.warn(`[VoiceService RTP] ⚠️ NO AUDIO DETECTED: Audio level is 0`);
                    }

                    previousStats = {
                        bytesReceived,
                        packetsReceived,
                        jitterBufferDelay,
                        audioLevel,
                    };
                } else {
                    console.warn(`[VoiceService RTP] No inbound RTP stats found for check #${checkCount}`);
                }
            } catch (error) {
                console.warn(`[VoiceService RTP] Error getting stats: ${error}`);
            }

            // Continue monitoring for specified duration
            if (checkCount < maxChecks && this.recvTransport && !this.recvTransport.closed) {
                setTimeout(checkStats, 1000);
            } else if (checkCount >= maxChecks) {
                console.log(`[VoiceService RTP] RTP monitoring completed after ${checkCount} seconds`);
            }
        };

        // Start stats monitoring
        console.log(`[VoiceService RTP] Starting RTP stats monitoring for ${userId} (Consumer: ${consumerId})`);
        checkStats();
    }

    /**
     * Monitor send RTP stats to verify microphone audio is being sent to server
     */
    private startSendRtpStatsMonitoring(producerId: string): void {
        let previousStats = {
            bytesSent: 0,
            packetsSent: 0,
            audioLevel: 0,
        };

        let checkCount = 0;
        const maxChecks = 20; // Check for 20 seconds (1 check per second)

        const checkStats = async () => {
            checkCount++;

            try {
                // Get WebRTC connection stats for send transport
                const stats = await this.sendTransport.getStats();

                // Debug: Log all stats types available
                if (checkCount === 1) {
                    console.log(`[VoiceService SEND RTP] ===== FIRST CHECK - DEEP DIAGNOSTICS =====`);

                    // Check producer internal sender
                    try {
                        const sender = (this.producer as any)._sender;
                        if (sender) {
                            console.log('[VoiceService SEND RTP] Producer._sender exists, getting sender stats...');
                            try {
                                const senderStats = await sender.getStats();
                                console.log('[VoiceService SEND RTP] RTCRtpSender.getStats():', senderStats);
                                senderStats.forEach((stat: any) => {
                                    if (stat.type === 'outbound-rtp') {
                                        console.log('[VoiceService SEND RTP] Sender outbound-rtp:', {
                                            bytesSent: stat.bytesSent,
                                            packetsSent: stat.packetsSent,
                                            packetsLost: stat.packetsLost,
                                            jitter: stat.jitter,
                                        });
                                    }
                                });
                            } catch (e) {
                                console.error('[VoiceService SEND RTP] Error getting sender stats:', e);
                            }
                        } else {
                            console.warn('[VoiceService SEND RTP] ⚠️⚠️⚠️ Producer._sender is NULL/UNDEFINED!');
                        }
                    } catch (e) {
                        console.error('[VoiceService SEND RTP] Error accessing _sender:', e);
                    }

                    const statsTypes: string[] = [];
                    stats.forEach((report) => {
                        if (!statsTypes.includes(report.type)) {
                            statsTypes.push(report.type);
                        }
                    });
                    console.log(`[VoiceService SEND RTP] Available stats types: ${statsTypes.join(', ')}`);

                    // Log all candidate pair and inbound-rtp stats for debugging
                    stats.forEach((report) => {
                        if (report.type === 'candidate-pair' && (report as any).state === 'succeeded') {
                            console.log(`[VoiceService SEND RTP] Active candidate pair: ${(report as any).localAddress}:${(report as any).localPort} <-> ${(report as any).remoteAddress}:${(report as any).remotePort}`);
                        }
                        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                            console.log(`[VoiceService SEND RTP] Inbound RTP state: ${JSON.stringify({
                                bytesReceived: (report as any).bytesReceived,
                                packetsReceived: (report as any).packetsReceived,
                            })}`);
                        }
                    });
                }

                let outboundRtpStats: any = null;
                stats.forEach((report) => {
                    if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                        outboundRtpStats = report;
                    }
                });

                if (outboundRtpStats) {
                    const bytesSent = outboundRtpStats.bytesSent || 0;
                    const packetsSent = outboundRtpStats.packetsSent || 0;

                    const bytesSentDelta = bytesSent - previousStats.bytesSent;
                    const packetsSentDelta = packetsSent - previousStats.packetsSent;

                    console.log(`[VoiceService SEND RTP] Check #${checkCount} for Producer: ${producerId}`);
                    console.log(`[VoiceService SEND RTP] Bytes sent: ${bytesSent} (Δ ${bytesSentDelta})`);
                    console.log(`[VoiceService SEND RTP] Packets sent: ${packetsSent} (Δ ${packetsSentDelta})`);

                    if (bytesSentDelta === 0 && checkCount > 3) {
                        console.warn(`[VoiceService SEND RTP] ⚠️ NO AUDIO BEING SENT! No bytes sent in last second`);
                    } else if (bytesSentDelta > 0) {
                        console.log(`[VoiceService SEND RTP] ✅ AUDIO BEING SENT: ${bytesSentDelta} bytes sent to server in last second`);
                    }

                    previousStats = {
                        bytesSent,
                        packetsSent,
                        audioLevel: 0,
                    };
                } else {
                    if (checkCount === 1) {
                        console.warn(`[VoiceService SEND RTP] ⚠️⚠️⚠️ NO OUTBOUND RTP STATS FOUND! Producer may not be encoding.`);
                        console.warn(`[VoiceService SEND RTP] Producer state:`, {
                            id: this.producer?.id,
                            paused: this.producer?.paused,
                            closed: this.producer?.closed,
                            trackId: this.producer?.track?.id,
                            trackEnabled: this.producer?.track?.enabled,
                            trackReadyState: this.producer?.track?.readyState,
                        });
                        console.warn(`[VoiceService SEND RTP] Send transport state:`, {
                            connectionState: this.sendTransport.connectionState,
                            closed: this.sendTransport.closed,
                        });
                    }
                }
            } catch (error) {
                console.warn(`[VoiceService SEND RTP] Error getting stats: ${error}`);
            }

            // Continue monitoring for specified duration
            if (checkCount < maxChecks && this.sendTransport && !this.sendTransport.closed) {
                setTimeout(checkStats, 1000);
            } else if (checkCount >= maxChecks) {
                console.log(`[VoiceService SEND RTP] Send RTP monitoring completed after ${checkCount} seconds`);
            }
        };

        // Start stats monitoring
        console.log(`[VoiceService SEND RTP] Starting send RTP stats monitoring for Producer: ${producerId}`);
        checkStats();
    }

    // ============================================================================
    // PRIVATE - SOCKET EVENT HANDLERS
    // ============================================================================

    /**
     * Setup socket event listeners
     */
    private setupSocketListeners(): void {
        if (!this.socket) return;

        console.log('[VoiceService] Setting up socket listeners on socket:', this.socket.id);

        // Always remove old listeners first to prevent duplicates
        this.socket.off('voice:new-producer');
        this.socket.off('voice:producer-closed');
        this.socket.off('room:user-left');
        this.socket.off('room:user-muted');
        this.socket.off('room:active-speaker');
        this.socket.off('room:closed');

        // New producer in the room
        this.socket.on('voice:new-producer', async (userId, producerId) => {
            console.log('[VoiceService] 🎤 Received voice:new-producer event!', { userId, producerId });
            this.log('New producer:', userId, producerId);
            try {
                await this.consumeProducer(userId, producerId);
                console.log('[VoiceService] ✅ Successfully consumed producer:', producerId);
            } catch (error) {
                console.error('[VoiceService] ❌ Failed to consume producer:', producerId, error);
            }
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

        console.log('[VoiceService] Socket listeners registered successfully');
    }

    // ============================================================================
    // PRIVATE - RECONNECTION HANDLING
    // ============================================================================

    /**
     * Cleanup socket event listeners (for reinitialization)
     */
    private cleanupSocketListeners(): void {
        if (!this.socket) {
            console.log('[VoiceService] No socket to cleanup listeners');
            return;
        }

        console.log('[VoiceService] Cleaning up socket listeners on socket:', this.socket.id);
        this.socket.off('voice:new-producer');
        this.socket.off('voice:producer-closed');
        this.socket.off('room:user-left');
        this.socket.off('room:user-muted');
        this.socket.off('room:active-speaker');
        this.socket.off('room:closed');
        this.socket.off('error');
        this.socket.off('disconnect');
        this.socket.off('connect');
        console.log('[VoiceService] Socket listeners cleaned up');
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
