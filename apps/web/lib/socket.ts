import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@free2talk/shared';
import { forceRefreshTokens, isTokenRefreshing } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let currentToken: string | null = null;
let isSocketRefreshingToken = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Connection state for external monitoring
type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
let connectionState: SocketConnectionState = 'disconnected';
const stateListeners = new Set<(state: SocketConnectionState) => void>();

export function onSocketStateChange(listener: (state: SocketConnectionState) => void) {
    stateListeners.add(listener);
    // Immediately call with current state
    listener(connectionState);
    return () => stateListeners.delete(listener);
}

function setConnectionState(state: SocketConnectionState) {
    connectionState = state;
    stateListeners.forEach(listener => listener(state));
}

export function getConnectionState(): SocketConnectionState {
    return connectionState;
}

/**
 * Wait for socket to be connected.
 * Returns immediately if already connected.
 * Waits for reconnection if socket.io is handling retries.
 * Rejects after timeout if connection ultimately fails.
 */
export function waitForConnection(timeoutMs: number = 15000): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    return new Promise((resolve, reject) => {
        const sock = getSocket();

        // Already connected
        if (sock.connected) {
            console.log('[Socket] waitForConnection: Already connected');
            resolve(sock);
            return;
        }

        console.log('[Socket] waitForConnection: Waiting for connection...');

        let resolved = false;
        let lastError: Error | null = null;

        const cleanup = () => {
            sock.off('connect', onConnect);
            sock.off('connect_error', onError);
            sock.io.off('reconnect_failed', onReconnectFailed);
        };

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                const errorMsg = lastError ? `Socket connection timeout: ${lastError.message}` : 'Socket connection timeout';
                console.error('[Socket] waitForConnection:', errorMsg);
                reject(new Error(errorMsg));
            }
        }, timeoutMs);

        const onConnect = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                cleanup();
                console.log('[Socket] waitForConnection: Connected!');
                resolve(sock);
            }
        };

        const onError = (err: Error) => {
            // Don't reject immediately - socket.io will retry automatically
            // Just store the error and let the timeout handle ultimate failure
            lastError = err;
            console.warn('[Socket] waitForConnection: Connection error (will retry):', err.message);
        };

        const onReconnectFailed = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                cleanup();
                console.error('[Socket] waitForConnection: Reconnection failed');
                reject(new Error('Socket reconnection failed'));
            }
        };

        sock.on('connect', onConnect);
        sock.on('connect_error', onError);
        sock.io.on('reconnect_failed', onReconnectFailed);

        // Ensure socket is trying to connect
        if (!sock.connected && connectionState !== 'connecting' && connectionState !== 'reconnecting') {
            console.log('[Socket] waitForConnection: Socket not connecting, triggering connect...');
            sock.connect();
        }
    });
}

/**
 * Get or create socket instance.
 * Socket will not auto-connect - use connectSocket() or updateSocketAuth() to connect.
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!socket) {
        console.log('[Socket] Creating new socket instance');

        socket = io(WS_URL, {
            auth: {
                token: currentToken || '',
            },
            transports: ['websocket', 'polling'],
            autoConnect: false, // Don't auto-connect, wait for auth token
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        });

        // Listen for external token refresh events (e.g., from API interceptor)
        if (typeof window !== 'undefined') {
            const handleTokensRefreshed = (e: Event) => {
                const detail = (e as CustomEvent<{ accessToken: string }>).detail;
                if (detail?.accessToken && !isSocketRefreshingToken) {
                    console.log('[Socket] External token refresh detected, reconnecting with new token...');
                    // Only reconnect if we're in an error state or disconnected due to auth
                    if (connectionState === 'error' || !socket?.connected) {
                        updateSocketAuth(detail.accessToken);
                    }
                }
            };
            window.addEventListener('auth:tokens-refreshed', handleTokensRefreshed as EventListener);
        }

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
            connectionAttempts = 0;
            setConnectionState('connected');
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server disconnected us, likely auth issue
                setConnectionState('error');
            } else {
                setConnectionState('disconnected');
            }
        });

        socket.io.on('reconnect_attempt', () => {
            console.log('[Socket] Reconnecting...');
            setConnectionState('reconnecting');
        });

        socket.io.on('reconnect', () => {
            console.log('[Socket] Reconnected');
            setConnectionState('connected');
        });

        socket.io.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed');
            setConnectionState('error');
        });

        socket.on('connect_error', async (error) => {
            const errorData = (error as any)?.data || {};
            const errorCode = errorData.code || 'UNKNOWN';
            const errorMessage = error.message || 'Connection failed';

            console.error(`[Socket] Connection error - Code: ${errorCode}, Message: ${errorMessage}`);

            // Handle auth-related errors
            const isAuthError = ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_MISSING', 'AUTH_ERROR'].includes(errorCode) ||
                errorMessage.includes('expired') ||
                errorMessage.includes('invalid') ||
                errorMessage.includes('Unauthorized');

            if (isAuthError) {
                // Check if API or socket is already refreshing
                if (isTokenRefreshing() || isSocketRefreshingToken) {
                    console.log('[Socket] Token refresh already in progress, waiting for auth:tokens-refreshed event...');
                    setConnectionState('reconnecting');
                    // The auth:tokens-refreshed listener will handle reconnection
                    return;
                }

                connectionAttempts++;

                if (connectionAttempts <= MAX_CONNECTION_ATTEMPTS) {
                    console.log(`[Socket] Auth error, attempting token refresh (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);

                    isSocketRefreshingToken = true;
                    setConnectionState('reconnecting');

                    try {
                        const { accessToken: newToken } = await forceRefreshTokens();
                        console.log('[Socket] Token refreshed successfully, reconnecting...');

                        // Small delay before reconnecting to ensure state is updated
                        await new Promise(resolve => setTimeout(resolve, 100));

                        updateSocketAuth(newToken);
                    } catch (refreshError) {
                        console.error('[Socket] Token refresh failed:', refreshError);
                        setConnectionState('error');

                        // Dispatch event for app to handle (redirect to login)
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('socket:auth-failed', {
                                detail: { error: refreshError }
                            }));
                        }
                    } finally {
                        isSocketRefreshingToken = false;
                    }
                } else {
                    console.error('[Socket] Max connection attempts reached');
                    setConnectionState('error');

                    // Dispatch event for app to handle
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('socket:auth-failed', {
                            detail: { error: new Error('Max connection attempts reached') }
                        }));
                    }
                }
            } else if (!isAuthError) {
                // Non-auth error, let socket.io handle reconnection
                setConnectionState('reconnecting');
            }
        });

        socket.on('error', (error) => {
            console.error('[Socket] Error event:', error);
        });
    }

    return socket;
}

/**
 * Connect socket without authentication (for unauthenticated hallway viewing)
 * Returns a promise that resolves when the socket is connected.
 */
export async function connectSocketUnauthenticated(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    const sock = getSocket();

    if (sock.connected) {
        console.log('[Socket] Already connected, no need to reconnect');
        return sock;
    }

    console.log('[Socket] Connecting without authentication (hallway viewing)...');
    setConnectionState('connecting');

    return new Promise((resolve, reject) => {
        let resolved = false;

        const cleanup = () => {
            sock.off('connect', onConnect);
            sock.off('connect_error', onConnectError);
        };

        const onConnect = () => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.log('[Socket] Connected without authentication:', sock.id);
                setConnectionState('connected');
                resolve(sock);
            }
        };

        const onConnectError = (err: Error) => {
            console.error('[Socket] Unauthenticated connection error:', err);
            // Don't reject immediately - let socket.io retry automatically
            // Just log the error
        };

        sock.on('connect', onConnect);
        sock.on('connect_error', onConnectError);

        // Set auth to empty for unauthenticated connection
        sock.auth = { token: '' };
        currentToken = null;

        // Connect to socket
        sock.connect();

        // Timeout after 20 seconds to give socket.io more time to retry
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                console.error('[Socket] Unauthenticated socket connection timeout after 20s');
                // Don't reject - return the socket anyway so hallway can try to use it
                // The socket may connect later or the app can handle partial functionality
                resolve(sock);
            }
        }, 20000);
    });
}

// Guard against concurrent updateSocketAuth calls
let pendingAuthPromise: Promise<Socket<ServerToClientEvents, ClientToServerEvents>> | null = null;
let pendingAuthToken: string | null = null;

/**
 * Update socket auth token and connect/reconnect.
 * Returns a promise that resolves when the socket is connected.
 * 
 * This function is guarded against concurrent calls - if called multiple times
 * with the same token, subsequent calls will wait for the first to complete.
 * If called with a different token while pending, the pending call completes
 * and a new connection is made with the new token.
 */
export function updateSocketAuth(token: string): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    // If there's a pending call with the same token, return that promise
    if (pendingAuthPromise && pendingAuthToken === token) {
        console.log('[Socket] updateSocketAuth: Returning existing pending promise for same token');
        return pendingAuthPromise;
    }

    // If socket is already connected with this token, return immediately
    const sock = getSocket();
    if (sock.connected && currentToken === token) {
        console.log('[Socket] updateSocketAuth: Already connected with this token, socket ID:', sock.id);
        return Promise.resolve(sock);
    }

    // Only disconnect/reconnect if the token is DIFFERENT from current token
    // If token is the same but socket is disconnected, just connect
    const needsReconnect = currentToken !== token && sock.connected;

    pendingAuthToken = token;
    pendingAuthPromise = new Promise((resolve, reject) => {
        if (!token) {
            console.warn('[Socket] updateSocketAuth called with empty token');
            pendingAuthPromise = null;
            pendingAuthToken = null;
            reject(new Error('No token provided'));
            return;
        }

        currentToken = token;
        sock.auth = { token };

        console.log('[Socket] Updating auth token and connecting... needsReconnect:', needsReconnect);
        setConnectionState('connecting');

        // Set up one-time connection handler
        const cleanup = () => {
            sock.off('connect', onConnect);
            sock.off('connect_error', onConnectError);
            // Clear pending promise when done
            if (pendingAuthToken === token) {
                pendingAuthPromise = null;
                pendingAuthToken = null;
            }
        };

        const onConnect = () => {
            cleanup();
            console.log('[Socket] Connected after auth update:', sock.id);
            resolve(sock);
        };

        const onConnectError = (err: Error) => {
            // Don't reject immediately - socket.io will retry
            // Only reject if it's a fatal auth error
            const errorData = (err as any)?.data || {};
            const errorCode = errorData.code || 'UNKNOWN';

            if (['TOKEN_INVALID', 'TOKEN_MISSING'].includes(errorCode)) {
                cleanup();
                reject(err);
            }
            // For other errors (including TOKEN_EXPIRED), let the existing error handler deal with it
        };

        sock.on('connect', onConnect);
        sock.on('connect_error', onConnectError);

        // Only disconnect if token changed and was connected
        if (needsReconnect) {
            console.log('[Socket] Token changed, disconnecting old socket...');
            sock.disconnect();
        }

        // Reset connection attempts on new token
        connectionAttempts = 0;

        // Only connect if not already connected
        if (!sock.connected) {
            sock.connect();
        }

        // Timeout after 15 seconds
        setTimeout(() => {
            if (!sock.connected) {
                cleanup();
                reject(new Error('Socket connection timeout'));
            }
        }, 15000);
    });

    return pendingAuthPromise;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
    return socket?.connected ?? false;
}

export function disconnectSocket() {
    if (socket) {
        console.log('[Socket] Disconnecting socket');
        socket.disconnect();
        socket = null;
        currentToken = null;
        connectionAttempts = 0;
        setConnectionState('disconnected');
    }
}
