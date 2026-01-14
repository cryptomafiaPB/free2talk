import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage, type PersistOptions } from 'zustand/middleware';

// Types
export interface User {
    id: string;
    email: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    nativeLanguages?: string[] | null;
    learningLanguages?: string[] | null;
    isOnline?: boolean;
    lastSeenAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setTokens: (tokens: AuthTokens | null) => void;
    setAccessToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setInitialized: (initialized: boolean) => void;
    login: (user: User, tokens: AuthTokens) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    reset: () => void;
}

const initialState = {
    user: null as User | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void) => ({
            ...initialState,

            setUser: (user: User | null) =>
                set({
                    user,
                    isAuthenticated: !!user,
                }),

            setTokens: (tokens: AuthTokens | null) =>
                set({
                    accessToken: tokens?.accessToken ?? null,
                    refreshToken: tokens?.refreshToken ?? null,
                }),

            setAccessToken: (token: string | null) =>
                set({ accessToken: token }),

            setLoading: (loading: boolean) =>
                set({ isLoading: loading }),

            setError: (error: string | null) =>
                set({ error }),

            setInitialized: (initialized: boolean) =>
                set({ isInitialized: initialized }),

            login: (user: User, tokens: AuthTokens) =>
                set({
                    user,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    isAuthenticated: true,
                    error: null,
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null,
                }),

            updateUser: (updates: Partial<User>) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            reset: () => set(initialState),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => {
                // Only use localStorage on client
                if (typeof window !== 'undefined') {
                    return localStorage;
                }
                // Return a no-op storage for SSR
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
            partialize: (state: AuthState) => ({
                // Only persist these fields
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Selectors for optimized re-renders
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectError = (state: AuthState) => state.error;
export const selectAccessToken = (state: AuthState) => state.accessToken;
