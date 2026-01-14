/**
 * Random Call Service Hook
 * 
 * Provides state management and WebSocket communication for random voice calls.
 * Uses P2P WebRTC for direct peer-to-peer audio communication.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { getSocket, waitForConnection, getConnectionState, updateSocketAuth } from '@/lib/socket';
import { useAuthStore, selectAccessToken, selectIsInitialized } from '@/lib/stores';
import type {
    RandomCallStats,
    RandomCallPreferences,
    RandomCallSession,
    RandomCallEndReason,
    RTCIceCandidateInit,
    RTCSessionDescriptionInit,
} from '@free2talk/shared';

// ==================== Types ====================

export type RandomCallState =
    | 'idle'           // Not in queue
    | 'queued'         // Waiting for match
    | 'connecting'     // Match found, establishing P2P
    | 'connected'      // Active call
    | 'ended';         // Call ended

export interface RandomCallPartner {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface ConnectionQuality {
    /** Quality level: 'excellent' | 'good' | 'fair' | 'poor' */
    level: 'excellent' | 'good' | 'fair' | 'poor';
    /** Round-trip time in milliseconds */
    rtt: number;
    /** Packet loss percentage */
    packetLoss: number;
    /** Jitter in milliseconds */
    jitter: number;
    /** Available bandwidth estimate (if available) */
    bandwidth?: number;
}

export interface ChatMessage {
    id: string;
    message: string;
    senderId: string;
    timestamp: number;
    isOwn: boolean;
}

export interface UseRandomCallOptions {
    /** Auto-subscribe to stats updates */
    subscribeToStats?: boolean;
    /** ICE servers for WebRTC */
    iceServers?: RTCIceServer[];
    /** Enable voice activity detection */
    enableVAD?: boolean;
}

export interface UseRandomCallReturn {
    // State
    state: RandomCallState;
    stats: RandomCallStats | null;
    partner: RandomCallPartner | null;
    sessionId: string | null;
    matchedLanguage: string | null;
    isAudioEnabled: boolean;
    error: string | null;

    // Connection quality
    connectionQuality: ConnectionQuality | null;

    // Voice activity
    isSpeaking: boolean;
    isPartnerSpeaking: boolean;

    // Text chat
    messages: ChatMessage[];
    sendMessage: (message: string) => void;

    // Call duration
    callDuration: number;

    // Actions
    startQueue: (preferences?: RandomCallPreferences) => Promise<void>;
    cancelQueue: () => Promise<void>;
    nextPartner: () => Promise<void>;
    endCall: (rating?: 1 | 2 | 3 | 4 | 5) => Promise<void>;
    toggleAudio: () => void;
    reportUser: (reason: string, details?: string) => Promise<void>;

    // Audio
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

// Default ICE servers (free STUN servers)
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

// ==================== Hook ====================

export function useRandomCall(options: UseRandomCallOptions = {}): UseRandomCallReturn {
    const {
        subscribeToStats = true,
        iceServers = DEFAULT_ICE_SERVERS,
        enableVAD = true,
    } = options;

    // Auth state
    const accessToken = useAuthStore(selectAccessToken);
    const isAuthInitialized = useAuthStore(selectIsInitialized);
    const currentUserId = useAuthStore(state => state.user?.id);

    // State
    const [state, setState] = useState<RandomCallState>('idle');
    const [stats, setStats] = useState<RandomCallStats | null>(null);
    const [partner, setPartner] = useState<RandomCallPartner | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [matchedLanguage, setMatchedLanguage] = useState<string | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Connection quality state
    const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);

    // Voice activity state
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);

    // Text chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Call duration state
    const [callDuration, setCallDuration] = useState(0);
    const callStartTimeRef = useRef<number | null>(null);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const isInitiatorRef = useRef(false);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const mountedRef = useRef(true);
    const sessionIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
    const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clear intervals
        if (vadIntervalRef.current) {
            clearInterval(vadIntervalRef.current);
            vadIntervalRef.current = null;
        }
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
        analyserRef.current = null;
        remoteAnalyserRef.current = null;

        setLocalStream(null);
        localStreamRef.current = null;
        setRemoteStream(null);
        setPartner(null);
        setSessionId(null);
        sessionIdRef.current = null;
        setMatchedLanguage(null);
        pendingCandidatesRef.current = [];

        // Reset new state
        setConnectionQuality(null);
        setIsSpeaking(false);
        setIsPartnerSpeaking(false);
        setMessages([]);
        setCallDuration(0);
        callStartTimeRef.current = null;
    }, []);

    // ==================== Connection Quality Monitoring ====================

    const startConnectionQualityMonitoring = useCallback(() => {
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
        }

        statsIntervalRef.current = setInterval(async () => {
            const pc = peerConnectionRef.current;
            if (!pc || pc.connectionState !== 'connected') return;

            try {
                const stats = await pc.getStats();
                let rtt = 0;
                let packetLoss = 0;
                let jitter = 0;
                let bandwidth = 0;

                stats.forEach((report) => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
                        bandwidth = report.availableOutgoingBitrate || 0;
                    }
                    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                        const packetsLost = report.packetsLost || 0;
                        const packetsReceived = report.packetsReceived || 0;
                        const totalPackets = packetsLost + packetsReceived;
                        packetLoss = totalPackets > 0 ? (packetsLost / totalPackets) * 100 : 0;
                        jitter = report.jitter ? report.jitter * 1000 : 0;
                    }
                });

                // Determine quality level
                let level: ConnectionQuality['level'] = 'excellent';
                if (rtt > 300 || packetLoss > 5 || jitter > 50) {
                    level = 'poor';
                } else if (rtt > 200 || packetLoss > 2 || jitter > 30) {
                    level = 'fair';
                } else if (rtt > 100 || packetLoss > 1 || jitter > 15) {
                    level = 'good';
                }

                if (mountedRef.current) {
                    setConnectionQuality({ level, rtt, packetLoss, jitter, bandwidth });
                }
            } catch (err) {
                console.warn('[RandomCall] Failed to get connection stats:', err);
            }
        }, 2000); // Update every 2 seconds
    }, []);

    // ==================== Voice Activity Detection ====================

    const startVAD = useCallback((localStream: MediaStream, remoteStream?: MediaStream) => {
        if (!enableVAD) return;

        try {
            // Create audio context if not exists
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            const audioContext = audioContextRef.current;

            // Setup local stream analyser
            const localSource = audioContext.createMediaStreamSource(localStream);
            analyserRef.current = audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            localSource.connect(analyserRef.current);

            // Setup remote stream analyser if available
            if (remoteStream) {
                const remoteSource = audioContext.createMediaStreamSource(remoteStream);
                remoteAnalyserRef.current = audioContext.createAnalyser();
                remoteAnalyserRef.current.fftSize = 256;
                remoteSource.connect(remoteAnalyserRef.current);
            }

            // VAD check interval
            const SILENCE_THRESHOLD = 15; // Adjust based on testing

            if (vadIntervalRef.current) {
                clearInterval(vadIntervalRef.current);
            }

            vadIntervalRef.current = setInterval(() => {
                // Check local speaking
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setIsSpeaking(average > SILENCE_THRESHOLD);
                }

                // Check remote speaking
                if (remoteAnalyserRef.current) {
                    const dataArray = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
                    remoteAnalyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setIsPartnerSpeaking(average > SILENCE_THRESHOLD);
                }
            }, 100); // Check every 100ms
        } catch (err) {
            console.warn('[RandomCall] Failed to setup VAD:', err);
        }
    }, [enableVAD]);

    // ==================== Call Duration Timer ====================

    const startCallDurationTimer = useCallback(() => {
        callStartTimeRef.current = Date.now();
        setCallDuration(0);

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        durationIntervalRef.current = setInterval(() => {
            if (callStartTimeRef.current && mountedRef.current) {
                const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
                setCallDuration(elapsed);
            }
        }, 1000);
    }, []);

    // ==================== Text Chat ====================

    const sendMessage = useCallback((message: string) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || !sessionIdRef.current) return;

        const socket = getSocket();
        const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add to local messages immediately (optimistic)
        const newMessage: ChatMessage = {
            id: messageId,
            message: trimmedMessage,
            senderId: currentUserId || '',
            timestamp: Date.now(),
            isOwn: true,
        };

        setMessages(prev => [...prev, newMessage]);

        // Send via socket
        socket.emit('random:chat_message' as any, {
            sessionId: sessionIdRef.current,
            message: trimmedMessage,
        });
    }, [currentUserId]);

    // Handle incoming chat message
    const handleChatMessage = useCallback((payload: { message: string; senderId: string; timestamp: number }) => {
        if (!mountedRef.current) return;

        const messageId = `${payload.timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: ChatMessage = {
            id: messageId,
            message: payload.message,
            senderId: payload.senderId,
            timestamp: payload.timestamp,
            isOwn: false,
        };

        setMessages(prev => [...prev, newMessage]);
    }, []);

    // Initialize local audio stream
    const initLocalStream = useCallback(async (): Promise<MediaStream> => {
        // If we already have a stream (from startQueue), reuse it
        if (localStreamRef.current && localStreamRef.current.active) {
            console.log('[RandomCall] Reusing existing microphone stream');
            return localStreamRef.current;
        }

        console.log('[RandomCall] Requesting microphone access...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            });
            console.log('[RandomCall] Microphone access granted');
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('[RandomCall] Failed to get local stream:', err);
            setError('Failed to access microphone');
            throw err;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback(async (stream: MediaStream): Promise<RTCPeerConnection> => {
        console.log('[RandomCall] Creating peer connection...');
        const pc = new RTCPeerConnection({ iceServers });

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });
        console.log('[RandomCall] Added local tracks to peer connection');

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('[RandomCall] Remote track received:', {
                kind: event.track.kind,
                enabled: event.track.enabled,
                muted: event.track.muted,
                readyState: event.track.readyState,
                streamId: event.streams[0]?.id
            });
            const [remoteStream] = event.streams;
            if (remoteStream) {
                console.log('[RandomCall] Remote stream tracks:', remoteStream.getTracks().map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    muted: t.muted,
                    readyState: t.readyState
                })));
                if (mountedRef.current) {
                    setRemoteStream(remoteStream);
                    // Start VAD with both streams
                    if (localStreamRef.current) {
                        startVAD(localStreamRef.current, remoteStream);
                    }
                }
            } else {
                console.warn('[RandomCall] No remote stream in ontrack event');
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && sessionIdRef.current) {
                const socket = getSocket();
                socket.emit('random:ice_candidate' as any, {
                    sessionId: sessionIdRef.current,
                    candidate: event.candidate.toJSON(),
                });
                console.log('[RandomCall] Sent ICE candidate');
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('[RandomCall] Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected' && mountedRef.current) {
                setState('connected');
                // Start monitoring when connected
                startConnectionQualityMonitoring();
                startCallDurationTimer();
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                if (mountedRef.current) {
                    setError('Connection lost');
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[RandomCall] ICE state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [iceServers]);

    // Handle incoming match
    const handleMatchInstant = useCallback(async (payload: RandomCallSession) => {
        console.log('[RandomCall] Match found:', payload);
        console.log('[RandomCall] Role:', payload.isInitiator ? 'INITIATOR' : 'RECEIVER');

        if (!mountedRef.current) {
            console.log('[RandomCall] Component unmounted, aborting');
            return;
        }

        // Update both state and ref for sessionId
        setSessionId(payload.sessionId);
        sessionIdRef.current = payload.sessionId;
        setPartner(payload.partnerInfo);
        setMatchedLanguage(payload.matchedLanguage ?? null);
        isInitiatorRef.current = payload.isInitiator;
        setState('connecting');
        setError(null);

        console.log('[RandomCall] Starting WebRTC setup...');

        try {
            // Get local stream
            console.log('[RandomCall] Step 1: Getting microphone...');
            const stream = await initLocalStream();
            console.log('[RandomCall] Step 1: Complete - got stream');

            // Create peer connection
            console.log('[RandomCall] Step 2: Creating peer connection...');
            const pc = await createPeerConnection(stream);
            console.log('[RandomCall] Step 2: Complete - peer connection created');

            // If initiator, create and send offer
            if (payload.isInitiator) {
                console.log('[RandomCall] Step 3: Creating offer (initiator)...');
                const offer = await pc.createOffer();
                console.log('[RandomCall] Step 3a: Offer created, setting local description...');
                await pc.setLocalDescription(offer);
                console.log('[RandomCall] Step 3b: Local description set, sending offer to peer...');

                const socket = getSocket();
                socket.emit('random:offer' as any, {
                    sessionId: payload.sessionId,
                    offer: {
                        type: offer.type,
                        sdp: offer.sdp,
                    },
                });
                console.log('[RandomCall] Step 3c: Offer sent successfully!');
            } else {
                console.log('[RandomCall] Waiting for offer from initiator...');
            }
        } catch (err) {
            console.error('[RandomCall] Error handling match:', err);
            if (mountedRef.current) {
                setError('Failed to establish connection');
                setState('idle');
            }
        }
    }, [initLocalStream, createPeerConnection]);

    // Handle incoming offer
    const handleOffer = useCallback(async (payload: { offer: RTCSessionDescriptionInit }) => {
        console.log('[RandomCall] Received offer');

        const pc = peerConnectionRef.current;
        const currentSessionId = sessionIdRef.current;
        if (!pc || !currentSessionId) {
            console.log('[RandomCall] Cannot handle offer - no PC or sessionId', { pc: !!pc, sessionId: currentSessionId });
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

            // Process any pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const socket = getSocket();
            socket.emit('random:answer' as any, {
                sessionId: currentSessionId,
                answer: {
                    type: answer.type,
                    sdp: answer.sdp,
                },
            });
            console.log('[RandomCall] Sent answer');
        } catch (err) {
            console.error('[RandomCall] Error handling offer:', err);
        }
    }, []);

    // Handle incoming answer
    const handleAnswer = useCallback(async (payload: { answer: RTCSessionDescriptionInit }) => {
        console.log('[RandomCall] Received answer');

        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));

            // Process any pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];
        } catch (err) {
            console.error('[RandomCall] Error handling answer:', err);
        }
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (payload: { candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionRef.current;

        if (!pc) {
            // Store for later if peer connection not ready
            pendingCandidatesRef.current.push(payload.candidate);
            return;
        }

        if (!pc.remoteDescription) {
            // Store for later if remote description not set
            pendingCandidatesRef.current.push(payload.candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
            console.error('[RandomCall] Error adding ICE candidate:', err);
        }
    }, []);

    // Handle partner disconnected
    const handlePartnerDisconnected = useCallback(() => {
        console.log('[RandomCall] Partner disconnected');
        if (mountedRef.current) {
            cleanup();
            setState('ended');
            setError('Partner disconnected');
        }
    }, [cleanup]);

    // Handle call ended
    const handleCallEnded = useCallback((payload: RandomCallEndReason) => {
        console.log('[RandomCall] Call ended:', payload.reason);
        if (mountedRef.current) {
            cleanup();
            setState('ended');
        }
    }, [cleanup]);

    // Handle stats update
    const handleStatsUpdate = useCallback((newStats: RandomCallStats) => {
        if (mountedRef.current) {
            setStats(newStats);
        }
    }, []);

    // Handle connection timeout
    const handleConnectionTimeout = useCallback(() => {
        console.log('[RandomCall] Connection timeout');
        if (mountedRef.current) {
            cleanup();
            setState('idle');
            setError('Connection timeout - please try again');
        }
    }, [cleanup]);

    // Handle error from backend
    const handleError = useCallback((payload: { message: string }) => {
        console.log('[RandomCall] Error from backend:', payload.message);
        if (mountedRef.current) {
            setError(payload.message);
        }
    }, []);

    // Setup socket event listeners and authentication
    useEffect(() => {
        mountedRef.current = true;

        // Wait for auth to be initialized
        if (!isAuthInitialized) {
            console.log('[RandomCall] Auth not initialized yet, waiting...');
            return;
        }

        if (!accessToken) {
            console.log('[RandomCall] No access token available');
            setError('Authentication required');
            return;
        }

        const socket = getSocket();
        let isMounted = true;

        // Ensure socket is authenticated before registering handlers
        const initializeSocket = async () => {
            try {
                if (!socket.connected) {
                    console.log('[RandomCall] Socket not connected, connecting with token...');
                    await updateSocketAuth(accessToken);
                }

                if (!isMounted) return;

                // Register event handlers
                socket.on('random:match_instant' as any, handleMatchInstant);
                socket.on('random:offer' as any, handleOffer);
                socket.on('random:answer' as any, handleAnswer);
                socket.on('random:ice_candidate' as any, handleIceCandidate);
                socket.on('random:partner_disconnected' as any, handlePartnerDisconnected);
                socket.on('random:call_ended' as any, handleCallEnded);
                socket.on('random:stats_update' as any, handleStatsUpdate);
                socket.on('random:connection_timeout' as any, handleConnectionTimeout);
                socket.on('random:error' as any, handleError);
                socket.on('random:chat_message' as any, handleChatMessage);

                // Subscribe to stats if enabled
                if (subscribeToStats) {
                    socket.emit('random:subscribe_stats' as any);
                }

                console.log('[RandomCall] Socket initialized and ready');
            } catch (err) {
                console.error('[RandomCall] Failed to initialize socket:', err);
                if (isMounted) {
                    setError('Failed to connect to server');
                }
            }
        };

        initializeSocket();

        return () => {
            mountedRef.current = false;
            isMounted = false;

            // Unregister event handlers
            socket.off('random:match_instant' as any, handleMatchInstant);
            socket.off('random:offer' as any, handleOffer);
            socket.off('random:answer' as any, handleAnswer);
            socket.off('random:ice_candidate' as any, handleIceCandidate);
            socket.off('random:partner_disconnected' as any, handlePartnerDisconnected);
            socket.off('random:call_ended' as any, handleCallEnded);
            socket.off('random:stats_update' as any, handleStatsUpdate);
            socket.off('random:connection_timeout' as any, handleConnectionTimeout);
            socket.off('random:error' as any, handleError);
            socket.off('random:chat_message' as any, handleChatMessage);

            // Unsubscribe from stats
            if (subscribeToStats) {
                socket.emit('random:unsubscribe_stats' as any);
            }

            // Cleanup on unmount
            cleanup();
        };
    }, [
        isAuthInitialized,
        accessToken,
        subscribeToStats,
        handleMatchInstant,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        handlePartnerDisconnected,
        handleCallEnded,
        handleStatsUpdate,
        handleConnectionTimeout,
        handleError,
        handleChatMessage,
        cleanup,
    ]);

    // ==================== Actions ====================

    const startQueue = useCallback(async (preferences?: RandomCallPreferences) => {
        if (!accessToken) {
            setError('Authentication required');
            return;
        }

        try {
            setError(null);

            // Request microphone access BEFORE joining queue
            console.log('[RandomCall] Requesting microphone permission before joining queue...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                console.log('[RandomCall] Microphone permission granted, storing stream');
                setLocalStream(stream);
                localStreamRef.current = stream;
            } catch (micError) {
                console.error('[RandomCall] Microphone permission denied:', micError);
                setError('Microphone access required for voice calls');
                return;
            }

            setState('queued');

            // Ensure socket is authenticated
            const socket = getSocket();
            if (!socket.connected) {
                console.log('[RandomCall] Socket not connected, connecting with auth...');
                await updateSocketAuth(accessToken);
            }

            // Wait for connection to be established
            await waitForConnection();

            socket.emit('random:start_queue' as any, {
                preferences: preferences ?? { preferenceEnabled: false },
            }, (response: any) => {
                if (!response.success) {
                    if (mountedRef.current) {
                        setError(response.error || 'Failed to join queue');
                        setState('idle');
                    }
                } else if (response.stats && mountedRef.current) {
                    setStats(response.stats);
                }
            });
        } catch (err) {
            console.error('[RandomCall] Error starting queue:', err);
            if (mountedRef.current) {
                setError('Failed to connect to server');
                setState('idle');
            }
        }
    }, [accessToken]);

    const cancelQueue = useCallback(async () => {
        try {
            const socket = getSocket();
            socket.emit('random:cancel_queue' as any, () => {
                if (mountedRef.current) {
                    cleanup();
                    setState('idle');
                }
            });
        } catch (err) {
            console.error('[RandomCall] Error canceling queue:', err);
        }
    }, [cleanup]);

    const nextPartner = useCallback(async () => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            cleanup();
            setState('queued');
            setError(null);

            const socket = getSocket();
            socket.emit('random:next_partner' as any, { sessionId: currentSessionId }, (response: any) => {
                if (!response.success && mountedRef.current) {
                    setError(response.error || 'Failed to find next partner');
                    setState('idle');
                }
            });
        } catch (err) {
            console.error('[RandomCall] Error getting next partner:', err);
        }
    }, [cleanup]);

    const endCall = useCallback(async (rating?: 1 | 2 | 3 | 4 | 5) => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            const socket = getSocket();
            socket.emit('random:end_call' as any, { sessionId: currentSessionId, rating });

            cleanup();
            setState('idle');
        } catch (err) {
            console.error('[RandomCall] Error ending call:', err);
        }
    }, [cleanup]);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    const reportUser = useCallback(async (reason: string, details?: string) => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            const socket = getSocket();
            socket.emit('random:report_user' as any, { sessionId: currentSessionId, reason, details });
        } catch (err) {
            console.error('[RandomCall] Error reporting user:', err);
        }
    }, []);

    return {
        // State
        state,
        stats,
        partner,
        sessionId,
        matchedLanguage,
        isAudioEnabled,
        error,

        // Connection quality
        connectionQuality,

        // Voice activity
        isSpeaking,
        isPartnerSpeaking,

        // Text chat
        messages,
        sendMessage,

        // Call duration
        callDuration,

        // Actions
        startQueue,
        cancelQueue,
        nextPartner,
        endCall,
        toggleAudio,
        reportUser,

        // Audio
        localStream,
        remoteStream,
    };
}

// ==================== Stats Hook (Lightweight) ====================

export function useRandomCallStats(): RandomCallStats | null {
    const [stats, setStats] = useState<RandomCallStats | null>(null);
    const accessToken = useAuthStore(selectAccessToken);
    const isAuthInitialized = useAuthStore(selectIsInitialized);

    useEffect(() => {
        if (!isAuthInitialized || !accessToken) {
            return;
        }

        const socket = getSocket();
        let isMounted = true;

        const initializeStats = async () => {
            try {
                if (!socket.connected) {
                    await updateSocketAuth(accessToken);
                }

                if (!isMounted) return;

                const handleStats = (newStats: RandomCallStats) => {
                    if (isMounted) {
                        setStats(newStats);
                    }
                };

                socket.on('random:stats_update' as any, handleStats);
                socket.emit('random:subscribe_stats' as any);

                return handleStats;
            } catch (err) {
                console.error('[RandomCallStats] Failed to initialize:', err);
                return null;
            }
        };

        let handleStats: ((newStats: RandomCallStats) => void) | null = null;

        initializeStats().then((handler) => {
            if (handler) {
                handleStats = handler;
            }
        });

        return () => {
            isMounted = false;
            if (handleStats) {
                socket.off('random:stats_update' as any, handleStats);
            }
            socket.emit('random:unsubscribe_stats' as any);
        };
    }, [accessToken, isAuthInitialized]);

    return stats;
}
