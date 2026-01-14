/**
 * Voice React Hooks
 * 
 * React hooks for integrating the voice service into components.
 * Provides reactive state management and automatic cleanup.
 */

'use client';

import {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    createContext,
    useContext,
    type ReactNode,
} from 'react';
import { getSocket, updateSocketAuth, waitForConnection } from '@/lib/socket';
import { useAuthStore, selectAccessToken, selectIsInitialized } from '@/lib/stores';
import {
    getVoiceService,
    type VoiceService,
    type VoiceState,
    type VoiceConnectionState,
    type RemoteParticipant,
    type AudioDeviceOptions,
} from './index';

// ============================================================================
// VOICE CONTEXT
// ============================================================================

interface VoiceContextValue {
    service: VoiceService;
    state: VoiceState;
    isInitialized: boolean;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

interface VoiceProviderProps {
    children: ReactNode;
    debug?: boolean;
}

/**
 * Voice Provider - Initializes voice service and provides it to children
 */
export function VoiceProvider({ children, debug = false }: VoiceProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);
    const [state, setState] = useState<VoiceState>(() => getVoiceService().getState());
    const serviceRef = useRef<VoiceService>(getVoiceService({ debug }));
    const accessToken = useAuthStore(selectAccessToken);
    const isAuthInitialized = useAuthStore(selectIsInitialized);
    const initAttemptedRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        const service = serviceRef.current;
        mountedRef.current = true;

        // Wait for auth to be initialized before attempting socket connection
        if (!isAuthInitialized) {
            console.log('[VoiceProvider] Waiting for auth initialization...');
            return;
        }

        // Don't initialize without auth token
        if (!accessToken) {
            console.log('[VoiceProvider] Waiting for auth token...');
            setIsInitialized(false);
            initAttemptedRef.current = false;
            return;
        }

        console.log('[VoiceProvider] Have access token, setting up socket...');

        // Initialize voice service once socket is connected
        const initVoice = async () => {
            // Prevent duplicate initialization
            if (initAttemptedRef.current) {
                console.log('[VoiceProvider] Init already attempted, skipping');
                return;
            }

            initAttemptedRef.current = true;

            try {
                // Update socket auth and wait for connection
                // This ensures we have a fully connected socket before proceeding
                console.log('[VoiceProvider] Updating socket auth and connecting...');
                const socket = await updateSocketAuth(accessToken);

                if (!mountedRef.current) {
                    console.log('[VoiceProvider] Component unmounted during connection wait');
                    return;
                }

                console.log('[VoiceProvider] Socket connected:', socket.id, '- Initializing voice service...');

                await service.initialize(socket);

                if (!mountedRef.current) {
                    console.log('[VoiceProvider] Component unmounted during initialization');
                    return;
                }

                console.log('[VoiceProvider] Voice service initialized successfully');
                setIsInitialized(true);
                setInitError(null);
            } catch (err) {
                console.error('[VoiceProvider] Failed to initialize voice service:', err);
                if (mountedRef.current) {
                    setInitError(err instanceof Error ? err : new Error(String(err)));
                    initAttemptedRef.current = false; // Allow retry
                }
            }
        };

        // Start initialization
        initVoice();

        const socket = getSocket();

        // Handle socket disconnect
        const onDisconnect = (reason: string) => {
            console.log('[VoiceProvider] Socket disconnected:', reason);
            if (mountedRef.current) {
                setIsInitialized(false);
                initAttemptedRef.current = false;
            }
        };

        // Handle reconnection via manager
        const onReconnect = () => {
            console.log('[VoiceProvider] Socket reconnected, reinitializing...');
            initAttemptedRef.current = false;
            initVoice();
        };

        socket.on('disconnect', onDisconnect);
        socket.io.on('reconnect', onReconnect);

        // Listen for state changes
        const unsubscribe = service.on('state-changed', (newState) => {
            if (mountedRef.current) {
                setState(newState);
            }
        });

        return () => {
            console.log('[VoiceProvider] Cleanup - removing socket listeners');
            mountedRef.current = false;
            socket.off('disconnect', onDisconnect);
            socket.io.off('reconnect', onReconnect);
            unsubscribe();
        };
    }, [accessToken, isAuthInitialized]);

    // Keep socket auth in sync if tokens are refreshed while app is running
    useEffect(() => {
        const onTokensRefreshed = (e: Event) => {
            const detail = (e as CustomEvent<{ accessToken: string; refreshToken?: string }>).detail;
            if (detail?.accessToken) {
                console.log('[VoiceProvider] Tokens refreshed, updating socket auth');
                updateSocketAuth(detail.accessToken);
            }
        };

        // Handle auth failures
        const onAuthFailed = () => {
            console.log('[VoiceProvider] Socket auth failed, marking as not initialized');
            setIsInitialized(false);
            initAttemptedRef.current = false;
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('auth:tokens-refreshed', onTokensRefreshed as EventListener);
            window.addEventListener('socket:auth-failed', onAuthFailed);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('auth:tokens-refreshed', onTokensRefreshed as EventListener);
                window.removeEventListener('socket:auth-failed', onAuthFailed);
            }
        };
    }, []);

    const value = useMemo(
        () => ({
            service: serviceRef.current,
            state,
            isInitialized,
        }),
        [state, isInitialized]
    );

    return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

/**
 * Use voice context
 */
function useVoiceContext(): VoiceContextValue {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoice must be used within a VoiceProvider');
    }
    return context;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export interface UseVoiceReturn {
    // State
    isInitialized: boolean;
    connectionState: VoiceConnectionState;
    isConnecting: boolean;
    isConnected: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
    localAudioLevel: number;
    currentRoomId: string | null;
    remoteParticipants: RemoteParticipant[];
    error: Error | null;

    // Actions
    joinRoom: (roomId: string) => Promise<{ participants?: any[]; producers?: Array<{ userId: string; producerId: string; paused?: boolean }> }>;
    leaveRoom: () => Promise<void>;
    toggleMute: () => Promise<void>;
    setMuted: (muted: boolean) => Promise<void>;

    // Audio devices
    audioDevices: AudioDeviceOptions[];
    selectedDeviceId: string | null;
    refreshDevices: () => Promise<void>;
    switchDevice: (deviceId: string) => Promise<void>;
}

/**
 * Main voice hook - provides all voice functionality
 */
export function useVoice(): UseVoiceReturn {
    const { service, state, isInitialized } = useVoiceContext();
    const [audioDevices, setAudioDevices] = useState<AudioDeviceOptions[]>([]);

    // Fetch audio devices on mount
    useEffect(() => {
        if (isInitialized) {
            service.getAudioDevices().then(setAudioDevices);
        }
    }, [isInitialized, service]);

    // Convert remote participants map to array
    const remoteParticipants = useMemo(
        () => Array.from(state.remoteParticipants.values()),
        [state.remoteParticipants]
    );

    // Actions
    const joinRoom = useCallback(
        async (roomId: string) => {
            return await service.joinRoom(roomId);
        },
        [service]
    );

    const leaveRoom = useCallback(async () => {
        await service.leaveRoom();
    }, [service]);

    const toggleMute = useCallback(async () => {
        await service.toggleMute();
    }, [service]);

    const setMuted = useCallback(
        async (muted: boolean) => {
            await service.setMuted(muted);
        },
        [service]
    );

    const refreshDevices = useCallback(async () => {
        const devices = await service.getAudioDevices();
        setAudioDevices(devices);
    }, [service]);

    const switchDevice = useCallback(
        async (deviceId: string) => {
            await service.switchAudioDevice(deviceId);
        },
        [service]
    );

    return {
        // State
        isInitialized,
        connectionState: state.connectionState,
        isConnecting: state.isConnecting,
        isConnected: state.isConnected,
        isMuted: state.isMuted,
        isSpeaking: state.isSpeaking,
        localAudioLevel: state.localAudioLevel,
        currentRoomId: state.currentRoomId,
        remoteParticipants,
        error: state.error,

        // Actions
        joinRoom,
        leaveRoom,
        toggleMute,
        setMuted,

        // Audio devices
        audioDevices,
        selectedDeviceId: state.selectedAudioInputId,
        refreshDevices,
        switchDevice,
    };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for just connection state
 */
export function useVoiceConnection() {
    const { state } = useVoiceContext();

    return {
        connectionState: state.connectionState,
        isConnecting: state.isConnecting,
        isConnected: state.isConnected,
        currentRoomId: state.currentRoomId,
        error: state.error,
    };
}

/**
 * Hook for mute state and controls
 */
export function useVoiceMute() {
    const { service, state } = useVoiceContext();

    const toggleMute = useCallback(async () => {
        await service.toggleMute();
    }, [service]);

    const setMuted = useCallback(
        async (muted: boolean) => {
            await service.setMuted(muted);
        },
        [service]
    );

    return {
        isMuted: state.isMuted,
        isSpeaking: state.isSpeaking,
        toggleMute,
        setMuted,
    };
}

/**
 * Hook for remote participants
 */
export function useRemoteParticipants(): RemoteParticipant[] {
    const { state } = useVoiceContext();

    return useMemo(
        () => Array.from(state.remoteParticipants.values()),
        [state.remoteParticipants]
    );
}

/**
 * Hook for a specific remote participant
 */
export function useRemoteParticipant(userId: string): RemoteParticipant | undefined {
    const { state } = useVoiceContext();
    return state.remoteParticipants.get(userId);
}

/**
 * Hook for audio device management
 */
export function useAudioDevices() {
    const { service, state, isInitialized } = useVoiceContext();
    const [devices, setDevices] = useState<AudioDeviceOptions[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch devices
    const refreshDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const audioDevices = await service.getAudioDevices();
            setDevices(audioDevices);
        } finally {
            setIsLoading(false);
        }
    }, [service]);

    // Initial fetch
    useEffect(() => {
        if (isInitialized) {
            refreshDevices();
        }
    }, [isInitialized, refreshDevices]);

    // Switch device
    const switchDevice = useCallback(
        async (deviceId: string) => {
            await service.switchAudioDevice(deviceId);
        },
        [service]
    );

    return {
        devices,
        selectedDeviceId: state.selectedAudioInputId,
        isLoading,
        refreshDevices,
        switchDevice,
    };
}

// ============================================================================
// EVENT HOOKS
// ============================================================================

/**
 * Hook to subscribe to voice events
 */
export function useVoiceEvent<K extends keyof import('./types').VoiceServiceEvents>(
    event: K,
    callback: import('./types').VoiceServiceEvents[K]
) {
    const { service } = useVoiceContext();

    useEffect(() => {
        const unsubscribe = service.on(event, callback);
        return unsubscribe;
    }, [service, event, callback]);
}

/**
 * Hook for speaking detection with callback
 */
export function useOnSpeaking(callback: (userId: string, isSpeaking: boolean) => void) {
    useVoiceEvent('participant-speaking', callback);
}

/**
 * Hook for local speaking state
 */
export function useLocalSpeaking(): boolean {
    const { state } = useVoiceContext();
    return state.isSpeaking;
}
