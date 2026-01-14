/**
 * Profile Service
 * 
 * Handles profile-related API calls.
 */

import { apiClient } from '../api';
import type { User } from '../stores';

// ==================== Types ====================

export interface UserStats {
    totalPracticeMinutes: number;
    roomsJoined: number;
    roomsCreated: number;
    randomCallsCompleted: number;
    randomCallMinutes: number;
}

export interface UserProfile {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    nativeLanguages: string[] | null;
    learningLanguages: string[] | null;
    isOnline: boolean | null;
    lastSeenAt: string | null;
    createdAt: string;
}

export interface ProfileWithStats {
    profile: UserProfile;
    stats: UserStats;
}

export interface UserActivity {
    id: string;
    type: 'room_created' | 'room_joined' | 'random_call';
    data: {
        roomName?: string;
        roomTopic?: string;
        matchedLanguage?: string;
        durationSeconds?: number;
    };
    timestamp: string;
}

export interface UserRoom {
    id: string;
    name: string;
    slug: string | null;
    topic: string | null;
    languages: string[] | null;
    maxParticipants: number;
    isActive: boolean;
    createdAt: string;
}

export interface ProfileUpdateData {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    nativeLanguages?: string[];
    learningLanguages?: string[];
}

export interface AvatarUploadResult {
    avatarUrl: string;
    filename: string;
    size: number;
}

// ==================== Service Functions ====================

export const profileService = {
    /**
     * Get current user's full profile with stats
     */
    getMyProfile: async (): Promise<ProfileWithStats> => {
        const response = await apiClient.get<ProfileWithStats>('/users/me');
        if (!response.data) {
            throw new Error('Failed to get profile');
        }
        return response.data;
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (data: ProfileUpdateData): Promise<User> => {
        const response = await apiClient.patch<{ user: User }>('/users/me', data);
        if (!response.data?.user) {
            throw new Error('Failed to update profile');
        }
        return response.data.user;
    },

    /**
     * Update username
     */
    updateUsername: async (username: string): Promise<void> => {
        await apiClient.patch('/users/me/username', { username });
    },

    /**
     * Check if username is available
     */
    checkUsername: async (username: string): Promise<boolean> => {
        const response = await apiClient.get<{ available: boolean }>(`/users/check-username/${username}`);
        return response.data?.available ?? false;
    },

    /**
     * Get current user's activity
     */
    getMyActivity: async (limit: number = 10): Promise<UserActivity[]> => {
        const response = await apiClient.get<UserActivity[]>(`/users/me/activity?limit=${limit}`);
        return response.data ?? [];
    },

    /**
     * Get current user's rooms
     */
    getMyRooms: async (limit: number = 20): Promise<UserRoom[]> => {
        const response = await apiClient.get<UserRoom[]>(`/users/me/rooms?limit=${limit}`);
        return response.data ?? [];
    },

    /**
     * Get current user's stats
     */
    getMyStats: async (): Promise<UserStats> => {
        const response = await apiClient.get<UserStats>('/users/me/stats');
        if (!response.data) {
            throw new Error('Failed to get stats');
        }
        return response.data;
    },

    /**
     * Get public profile by username
     */
    getProfileByUsername: async (username: string): Promise<ProfileWithStats> => {
        const response = await apiClient.get<ProfileWithStats>(`/users/username/${username}`);
        if (!response.data) {
            throw new Error('User not found');
        }
        return response.data;
    },

    /**
     * Get public profile by ID
     */
    getProfileById: async (id: string): Promise<UserProfile> => {
        const response = await apiClient.get<UserProfile>(`/users/${id}`);
        if (!response.data) {
            throw new Error('User not found');
        }
        return response.data;
    },

    /**
     * Upload avatar image
     */
    uploadAvatar: async (file: File): Promise<AvatarUploadResult> => {
        const formData = new FormData();
        formData.append('avatar', file);

        // Use apiClient to automatically include auth headers
        const response = await apiClient.post<AvatarUploadResult>('/upload/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data) {
            throw new Error('Failed to upload avatar');
        }

        return response.data;
    },

    /**
     * Delete avatar
     */
    deleteAvatar: async (): Promise<void> => {
        await apiClient.delete('/upload/avatar');
    },
};
