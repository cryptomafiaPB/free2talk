/**
 * Room Socket Hook
 * 
 * Subscribes to room-specific socket events for real-time updates.
 * Handles user joins/leaves, kicks, owner changes, room closure.
 */

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { toast } from './use-toast';
import type { RoomParticipant } from '@/components/room/types';

export interface RoomSocketCallbacks {
    /** Called when a new user joins */
    onUserJoined?: (participant: RoomParticipant) => void;
    /** Called when a user leaves */
    onUserLeft?: (userId: string) => void;
    /** Called when a user is kicked (could be current user) */
    onUserKicked?: (userId: string, isCurrentUser: boolean) => void;
    /** Called when ownership changes */
    onOwnerChanged?: (newOwnerId: string) => void;
    /** Called when room is closed by owner */
    onRoomClosed?: (reason: string) => void;
    /** Called when a user's mute state changes */
    onUserMuted?: (userId: string, muted: boolean) => void;
    /** Called when active speaker changes */
    onActiveSpeaker?: (userId: string | null) => void;
}

export interface UseRoomSocketOptions {
    /** Room ID to subscribe to */
    roomId: string;
    /** Current user ID for kick detection */
    currentUserId: string;
    /** Callbacks for events */
    callbacks: RoomSocketCallbacks;
    /** Whether to enable the socket */
    enabled?: boolean;
}

/**
 * Hook to subscribe to room socket events
 * 
 * @example
 * useRoomSocket({
 *   roomId: 'abc123',
 *   currentUserId: 'user456',
 *   callbacks: {
 *     onUserJoined: (p) => addParticipant(p),
 *     onUserLeft: (id) => removeParticipant(id),
 *     onUserKicked: (id, isMe) => {
 *       if (isMe) router.push('/');
 *     },
 *     onRoomClosed: () => router.push('/'),
 *   }
 * });
 */
export function useRoomSocket({
    roomId,
    currentUserId,
    callbacks,
    enabled = true,
}: UseRoomSocketOptions) {
    // Store callbacks in ref to avoid re-subscribing
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    useEffect(() => {
        if (!enabled || !roomId) return;

        const socket = getSocket();

        // Handler for user joined
        const handleUserJoined = (participant: any) => {
            console.log('[RoomSocket] User joined:', participant);

            // Transform to our format
            const transformed: RoomParticipant = {
                id: participant.userId || participant.id,
                username: participant.user?.username || participant.username || 'Unknown',
                displayName: participant.user?.displayName || participant.displayName || null,
                avatarUrl: participant.user?.avatarUrl || participant.avatarUrl || null,
                isOwner: false,
                isMuted: true,
                isDeafened: false,
                isSpeaking: false,
                audioLevel: 0,
                joinedAt: participant.joinedAt || new Date().toISOString(),
            };

            callbacksRef.current.onUserJoined?.(transformed);

            // Show toast for other users
            if (transformed.id !== currentUserId) {
                toast.room.userJoined(transformed.displayName || transformed.username);
            }
        };

        // Handler for user left
        const handleUserLeft = (userId: string) => {
            console.log('[RoomSocket] User left:', userId);
            callbacksRef.current.onUserLeft?.(userId);
        };

        // Handler for user kicked
        const handleUserKicked = (userId: string) => {
            console.log('[RoomSocket] User kicked:', userId);
            const isCurrentUser = userId === currentUserId;

            if (isCurrentUser) {
                toast.room.kicked();
            }

            callbacksRef.current.onUserKicked?.(userId, isCurrentUser);
        };

        // Handler for owner changed
        const handleOwnerChanged = (newOwnerId: string) => {
            console.log('[RoomSocket] Owner changed:', newOwnerId);

            if (newOwnerId === currentUserId) {
                toast.success('You are now the room owner');
            }

            callbacksRef.current.onOwnerChanged?.(newOwnerId);
        };

        // Handler for room closed
        const handleRoomClosed = (reason: string) => {
            console.log('[RoomSocket] Room closed:', reason);
            toast.room.closed(reason || 'The room has been closed by the owner');
            callbacksRef.current.onRoomClosed?.(reason);
        };

        // Handler for user mute state
        const handleUserMuted = (userId: string, muted: boolean) => {
            console.log('[RoomSocket] User muted:', userId, muted);
            callbacksRef.current.onUserMuted?.(userId, muted);
        };

        // Handler for active speaker
        const handleActiveSpeaker = (userId: string | null) => {
            callbacksRef.current.onActiveSpeaker?.(userId);
        };

        // Subscribe to events
        socket.on('room:user-joined', handleUserJoined);
        socket.on('room:user-left', handleUserLeft);
        socket.on('room:user-kicked', handleUserKicked);
        socket.on('room:owner-changed', handleOwnerChanged);
        socket.on('room:closed', handleRoomClosed);
        socket.on('room:user-muted', handleUserMuted);
        socket.on('room:active-speaker', handleActiveSpeaker);

        return () => {
            socket.off('room:user-joined', handleUserJoined);
            socket.off('room:user-left', handleUserLeft);
            socket.off('room:user-kicked', handleUserKicked);
            socket.off('room:owner-changed', handleOwnerChanged);
            socket.off('room:closed', handleRoomClosed);
            socket.off('room:user-muted', handleUserMuted);
            socket.off('room:active-speaker', handleActiveSpeaker);
        };
    }, [roomId, currentUserId, enabled]);
}
