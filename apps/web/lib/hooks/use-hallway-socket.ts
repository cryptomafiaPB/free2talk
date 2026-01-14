'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket, onSocketStateChange, getConnectionState, updateSocketAuth } from '@/lib/socket';
import { useAuthStore, selectAccessToken, selectIsInitialized } from '@/lib/stores';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@free2talk/shared';

export interface RoomSummary {
    id: string;
    name: string;
    topic?: string;
    languages: string[];
    participantCount: number;
    maxParticipants: number;
    ownerId: string;
    ownerName: string;
    ownerAvatarUrl?: string;
}

export interface UseHallwaySocketOptions {
    onRoomCreated?: (room: RoomSummary) => void;
    onRoomUpdated?: (room: RoomSummary) => void;
    onRoomClosed?: (roomId: string) => void;
}

export function useHallwaySocket({
    onRoomCreated,
    onRoomUpdated,
    onRoomClosed,
}: UseHallwaySocketOptions = {}) {
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
    const accessToken = useAuthStore(selectAccessToken);
    const isAuthInitialized = useAuthStore(selectIsInitialized);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [connectionState, setConnectionState] = useState<string>(getConnectionState());
    const callbacksRef = useRef({ onRoomCreated, onRoomUpdated, onRoomClosed });
    const hasSubscribedRef = useRef(false);

    // Keep callbacks up to date
    useEffect(() => {
        callbacksRef.current = { onRoomCreated, onRoomUpdated, onRoomClosed };
    }, [onRoomCreated, onRoomUpdated, onRoomClosed]);

    // Track connection state changes
    useEffect(() => {
        const unsubscribe = onSocketStateChange((state) => {
            setConnectionState(state);
        });
        return () => { unsubscribe(); };
    }, []);

    // Subscribe to hallway events
    const subscribe = useCallback(() => {
        const socket = getSocket();
        if (!socket.connected) {
            console.log('[Hallway] Socket not connected, waiting...');
            return;
        }

        if (hasSubscribedRef.current) {
            console.log('[Hallway] Already subscribed');
            return;
        }

        socketRef.current = socket;
        hasSubscribedRef.current = true;

        // Subscribe to hallway updates
        socket.emit('hallway:subscribe');
        setIsSubscribed(true);
        console.log('[Hallway] Subscribed to updates');

        // Handle room created
        const handleRoomCreated = (room: RoomSummary) => {
            console.log('[Hallway] Room created', room);
            callbacksRef.current.onRoomCreated?.(room);
        };

        // Handle room updated
        const handleRoomUpdated = (room: RoomSummary) => {
            console.log('[Hallway] Room updated', room);
            callbacksRef.current.onRoomUpdated?.(room);
        };

        // Handle room closed
        const handleRoomClosed = (roomId: string) => {
            console.log('[Hallway] Room closed', roomId);
            callbacksRef.current.onRoomClosed?.(roomId);
        };

        socket.on('hallway:room-created', handleRoomCreated);
        socket.on('hallway:room-updated', handleRoomUpdated);
        socket.on('hallway:room-closed', handleRoomClosed);

        return () => {
            socket.off('hallway:room-created', handleRoomCreated);
            socket.off('hallway:room-updated', handleRoomUpdated);
            socket.off('hallway:room-closed', handleRoomClosed);
            socket.emit('hallway:unsubscribe');
            hasSubscribedRef.current = false;
            setIsSubscribed(false);
        };
    }, []);

    // Auto-subscribe when socket connects
    useEffect(() => {
        // Wait for auth to be initialized before attempting socket connection
        if (!isAuthInitialized) {
            console.log('[Hallway] Auth not initialized yet, waiting...');
            return;
        }

        const socket = getSocket();
        let cleanup: (() => void) | undefined;
        let isMounted = true;

        // Ensure socket has the latest token and is connecting
        const connectAndSubscribe = async (token: string) => {
            if (!token) return;

            if (!socket.connected) {
                console.log('[Hallway] Socket not connected, connecting with token...');
                try {
                    await updateSocketAuth(token);
                    if (isMounted && !hasSubscribedRef.current) {
                        cleanup = subscribe();
                    }
                } catch (err) {
                    console.error('[Hallway] Failed to connect socket:', err);
                }
            } else {
                // Already connected, just subscribe
                cleanup = subscribe();
            }
        };

        const handleConnect = () => {
            console.log('[Hallway] Socket connected, subscribing...');
            if (!hasSubscribedRef.current) {
                cleanup = subscribe();
            }
        };

        const handleDisconnect = () => {
            console.log('[Hallway] Socket disconnected');
            hasSubscribedRef.current = false;
            setIsSubscribed(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Start connection/subscription with a short retry window to allow token refresh to complete
        (async () => {
            const maxAttempts = 3;
            const waitMs = 500;

            let token = accessToken;
            for (let attempt = 1; attempt <= maxAttempts && !token; attempt++) {
                console.log(`[Hallway] No access token, waiting for refresh (attempt ${attempt}/${maxAttempts})...`);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
                token = useAuthStore.getState().accessToken;
            }

            if (!token) {
                console.log('[Hallway] Still no access token after wait window, skipping subscription');
                return;
            }

            await connectAndSubscribe(token);
        })();

        return () => {
            isMounted = false;
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            cleanup?.();
            hasSubscribedRef.current = false;
        };
    }, [accessToken, isAuthInitialized, subscribe]);

    return {
        isSubscribed,
        connectionState,
        isConnected: connectionState === 'connected',
        isConnecting: connectionState === 'connecting' || connectionState === 'reconnecting',
    };
}
