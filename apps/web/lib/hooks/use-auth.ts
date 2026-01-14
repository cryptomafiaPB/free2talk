'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, selectUser, selectIsAuthenticated, selectIsLoading, selectIsInitialized, selectAccessToken } from '../stores';
import { authService } from '../services';
import { setAuthTokens, forceRefreshTokens } from '../api';
import { toast } from './use-toast';
import type { LoginInput, RegisterInput } from '@free2talk/shared';
import type { User, AuthTokens } from '../stores';

// Query keys
export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Check if a JWT token is expired or will expire soon (within buffer time)
 */
function isTokenExpiredOrExpiringSoon(token: string, bufferSeconds: number = 60): boolean {
    try {
        // JWT structure: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        // Decode payload (base64url)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

        if (!payload.exp) return true;

        // Check if token expires within buffer time
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const bufferMs = bufferSeconds * 1000;

        return now >= (expiresAt - bufferMs);
    } catch {
        // If we can't decode the token, consider it expired
        return true;
    }
}

/**
 * Hook to initialize auth state from persisted storage
 * Should be called once at app root
 */
export function useAuthInitializer() {
    const { accessToken, refreshToken, setInitialized, setTokens, setUser, logout } = useAuthStore();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initializeAuth = async () => {
            // Always sync current persisted tokens (may be null) so API client knows state
            setAuthTokens(accessToken || null, refreshToken || null);

            if (accessToken) {
                // Check if access token is expired or expiring soon
                if (isTokenExpiredOrExpiringSoon(accessToken, 60)) {
                    console.log('[Auth] Access token expired or expiring soon, refreshing proactively...');

                    try {
                        const { accessToken: newAccess, refreshToken: newRefresh } = await forceRefreshTokens();
                        console.log('[Auth] Token refreshed successfully');
                        setTokens({ accessToken: newAccess, refreshToken: newRefresh || refreshToken || '' });
                        setAuthTokens(newAccess, newRefresh || refreshToken);

                        // Fetch user profile to restore authenticated state
                        try {
                            const user = await authService.getMe();
                            setUser(user);
                        } catch (err) {
                            console.warn('[Auth] Failed to fetch user after token refresh:', err);
                        }
                    } catch (error) {
                        console.error('[Auth] Failed to refresh token on init:', error);
                        // Token refresh failed - user needs to re-login
                        logout();
                        setAuthTokens(null, null);
                        toast.error('Session expired', {
                            description: 'Please sign in again.',
                            duration: 5000,
                        });
                    }
                } else {
                    console.log('[Auth] Access token is valid');
                }
            } else {
                // No access token persisted (common after reload if only httpOnly refresh cookie exists)
                // Try to refresh using cookie to obtain a fresh access token
                console.log('[Auth] No access token found, attempting refresh via cookie...');
                try {
                    const { accessToken: newAccess, refreshToken: newRefresh } = await forceRefreshTokens();
                    console.log('[Auth] Token obtained from refresh cookie');
                    setTokens({ accessToken: newAccess, refreshToken: newRefresh || refreshToken || '' });
                    setAuthTokens(newAccess, newRefresh || refreshToken);

                    // Fetch user profile to restore authenticated state
                    try {
                        const user = await authService.getMe();
                        setUser(user);
                    } catch (err) {
                        console.warn('[Auth] Failed to fetch user after token refresh:', err);
                    }
                } catch (error) {
                    // It's okay if this fails (no cookie or expired) — remain logged out gracefully
                    console.log('[Auth] No valid refresh cookie or refresh failed; continuing unauthenticated');
                }
            }

            setInitialized(true);
        };

        // Listen for token refresh events from API interceptor
        const handleTokensRefreshed = (event: CustomEvent<AuthTokens>) => {
            const { accessToken: newAccess, refreshToken: newRefresh } = event.detail;
            useAuthStore.getState().setTokens({ accessToken: newAccess, refreshToken: newRefresh });
            setAuthTokens(newAccess, newRefresh);
        };

        // Listen for forced logout from API interceptor
        const handleLogout = () => {
            logout();
            setAuthTokens(null, null);
            toast.error('Session expired', {
                description: 'Please sign in again.',
                duration: 5000,
            });
        };

        window.addEventListener('auth:tokens-refreshed', handleTokensRefreshed as EventListener);
        window.addEventListener('auth:logout', handleLogout);

        // Initialize auth (async)
        initializeAuth();

        return () => {
            window.removeEventListener('auth:tokens-refreshed', handleTokensRefreshed as EventListener);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [accessToken, refreshToken, setInitialized, setTokens, setUser, logout]);
}

/**
 * Hook to sync auth store tokens with API client
 */
export function useAuthSync() {
    const accessToken = useAuthStore(selectAccessToken);
    const refreshToken = useAuthStore((state) => state.refreshToken);

    useEffect(() => {
        setAuthTokens(accessToken, refreshToken);
    }, [accessToken, refreshToken]);
}

/**
 * Main auth hook - provides auth state and actions
 */
export function useAuth() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Selectors for optimized re-renders
    const user = useAuthStore(selectUser);
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isLoading = useAuthStore(selectIsLoading);
    const isInitialized = useAuthStore(selectIsInitialized);
    const error = useAuthStore((state) => state.error);

    // Actions
    const { login: storeLogin, logout: storeLogout, setLoading, setError, updateUser } = useAuthStore();

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: authService.login,
        onMutate: () => {
            setLoading(true);
            setError(null);
        },
        onSuccess: (data) => {
            const tokens: AuthTokens = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || '',
            };
            storeLogin(data.user, tokens);
            setAuthTokens(tokens.accessToken, tokens.refreshToken);
            queryClient.setQueryData(authKeys.me(), data.user);
        },
        onError: (error: Error) => {
            setError(error.message || 'Login failed');
        },
        onSettled: () => {
            setLoading(false);
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: authService.register,
        onMutate: () => {
            setLoading(true);
            setError(null);
        },
        onSuccess: (data) => {
            const tokens: AuthTokens = {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || '',
            };
            storeLogin(data.user, tokens);
            setAuthTokens(tokens.accessToken, tokens.refreshToken);
            queryClient.setQueryData(authKeys.me(), data.user);
        },
        onError: (error: Error) => {
            setError(error.message || 'Registration failed');
        },
        onSettled: () => {
            setLoading(false);
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onMutate: () => {
            setLoading(true);
        },
        onSuccess: () => {
            storeLogout();
            setAuthTokens(null, null);
            queryClient.clear();
            router.push('/login');
        },
        onError: () => {
            // Still logout locally even if API fails
            storeLogout();
            setAuthTokens(null, null);
            queryClient.clear();
            router.push('/login');
        },
        onSettled: () => {
            setLoading(false);
        },
    });

    // Action handlers
    const login = useCallback(
        async (data: LoginInput) => {
            return loginMutation.mutateAsync(data);
        },
        [loginMutation]
    );

    const register = useCallback(
        async (data: RegisterInput) => {
            return registerMutation.mutateAsync(data);
        },
        [registerMutation]
    );

    const logout = useCallback(async () => {
        return logoutMutation.mutateAsync();
    }, [logoutMutation]);

    return {
        // State
        user,
        isAuthenticated,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        isInitialized,
        error,

        // Actions
        login,
        register,
        logout,
        updateUser,
        clearError: () => setError(null),

        // Mutation states for fine-grained loading states
        loginStatus: loginMutation.status,
        registerStatus: registerMutation.status,
        logoutStatus: logoutMutation.status,
    };
}

/**
 * Hook to fetch and cache current user
 */
export function useCurrentUser() {
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const { updateUser } = useAuthStore();

    return useQuery({
        queryKey: authKeys.me(),
        queryFn: async () => {
            const user = await authService.getMe();
            updateUser(user);
            return user;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

/**
 * Hook for protected routes - redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = '/login') {
    const router = useRouter();
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isInitialized = useAuthStore(selectIsInitialized);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isInitialized, router, redirectTo]);

    return { isAuthenticated, isInitialized };
}

/**
 * Hook for guest routes - redirects to home if already authenticated
 */
export function useGuestOnly(redirectTo = '/') {
    const router = useRouter();
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isInitialized = useAuthStore(selectIsInitialized);

    useEffect(() => {
        if (isInitialized && isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isInitialized, router, redirectTo]);

    return { isAuthenticated, isInitialized };
}
