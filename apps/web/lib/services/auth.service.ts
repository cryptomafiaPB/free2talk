import { apiClient } from '../api';
import type { User, AuthTokens } from '../stores';
import type { LoginInput, RegisterInput } from '@free2talk/shared';

// Response types
interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
    message?: string;
}

interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

interface MeResponse {
    user: User;
}

/**
 * Authentication service - handles all auth-related API calls
 * Separating API logic from hooks for better testability and reusability
 */
export const authService = {
    /**
     * Register a new user
     */
    register: async (data: RegisterInput): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        if (!response.data) {
            throw new Error('Registration failed');
        }
        return response.data;
    },

    /**
     * Login with email and password
     */
    login: async (data: LoginInput): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        if (!response.data) {
            throw new Error('Login failed');
        }
        return response.data;
    },

    /**
     * Logout the current user
     */
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    /**
     * Refresh access token
     */
    refresh: async (refreshToken?: string): Promise<RefreshResponse> => {
        const response = await apiClient.post<RefreshResponse>(
            '/auth/refresh',
            {},
            refreshToken ? { headers: { 'x-refresh-token': refreshToken } } : {}
        );
        if (!response.data) {
            throw new Error('Token refresh failed');
        }
        return response.data;
    },

    /**
     * Get current user profile
     */
    getMe: async (): Promise<User> => {
        const response = await apiClient.get<MeResponse>('/auth/me');
        if (!response.data?.user) {
            throw new Error('Failed to get user');
        }
        return response.data.user;
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.patch<{ user: User }>('/users/me', data);
        if (!response.data?.user) {
            throw new Error('Failed to update profile');
        }
        return response.data.user;
    },
};

export type { AuthResponse, RefreshResponse, MeResponse };
