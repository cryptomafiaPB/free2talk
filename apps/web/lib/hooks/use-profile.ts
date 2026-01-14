/**
 * useProfile Hook
 * 
 * Manages profile data fetching and mutations.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { profileService, type ProfileWithStats, type UserActivity, type UserRoom, type ProfileUpdateData } from '../services/profile.service';
import { useAuthStore } from '../stores';

// ==================== Types ====================

interface UseProfileReturn {
    profile: ProfileWithStats | null;
    activity: UserActivity[];
    rooms: UserRoom[];
    isLoading: boolean;
    isUpdating: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
    updateUsername: (username: string) => Promise<boolean>;
}

// ==================== Hook ====================

export function useProfile(): UseProfileReturn {
    const { user, updateUser, isAuthenticated } = useAuthStore();
    const [profile, setProfile] = useState<ProfileWithStats | null>(null);
    const [activity, setActivity] = useState<UserActivity[]>([]);
    const [rooms, setRooms] = useState<UserRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all profile data
    const fetchProfile = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const [profileData, activityData, roomsData] = await Promise.all([
                profileService.getMyProfile(),
                profileService.getMyActivity(10),
                profileService.getMyRooms(20),
            ]);

            setProfile(profileData);
            setActivity(activityData);
            setRooms(roomsData);
        } catch (err) {
            console.error('[useProfile] Error fetching profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Initial fetch
    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Update profile
    const handleUpdateProfile = useCallback(async (data: ProfileUpdateData): Promise<boolean> => {
        try {
            setIsUpdating(true);
            setError(null);

            const updatedUser = await profileService.updateProfile(data);

            // Update auth store
            updateUser(updatedUser);

            // Refetch profile to get updated stats
            await fetchProfile();

            return true;
        } catch (err) {
            console.error('[useProfile] Error updating profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [updateUser, fetchProfile]);

    // Update username
    const handleUpdateUsername = useCallback(async (username: string): Promise<boolean> => {
        try {
            setIsUpdating(true);
            setError(null);

            await profileService.updateUsername(username);

            // Update auth store
            updateUser({ username });

            // Refetch profile
            await fetchProfile();

            return true;
        } catch (err) {
            console.error('[useProfile] Error updating username:', err);
            setError(err instanceof Error ? err.message : 'Failed to update username');
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [updateUser, fetchProfile]);

    return {
        profile,
        activity,
        rooms,
        isLoading,
        isUpdating,
        error,
        refetch: fetchProfile,
        updateProfile: handleUpdateProfile,
        updateUsername: handleUpdateUsername,
    };
}

// ==================== Username Check Hook ====================

interface UseUsernameCheckReturn {
    isAvailable: boolean | null;
    isChecking: boolean;
    checkUsername: (username: string) => Promise<void>;
}

export function useUsernameCheck(): UseUsernameCheckReturn {
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkUsername = useCallback(async (username: string) => {
        if (!username || username.length < 3) {
            setIsAvailable(null);
            return;
        }

        try {
            setIsChecking(true);
            const available = await profileService.checkUsername(username);
            setIsAvailable(available);
        } catch {
            setIsAvailable(null);
        } finally {
            setIsChecking(false);
        }
    }, []);

    return {
        isAvailable,
        isChecking,
        checkUsername,
    };
}
