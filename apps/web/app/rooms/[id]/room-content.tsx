'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/design-system';
import {
    Button,
    Avatar,
    LanguageBadge,
    Card,
} from '@/components/ui';
import {
    Mic,
    MicOff,
    Phone,
    Users,
    Settings,
    ChevronLeft,
    MoreVertical,
    Crown,
    VolumeX,
    Volume2,
    Loader2,
    AlertCircle,
} from '@/components/ui/icons';
import { VoiceProvider } from '@/lib/services/voice';
import { EnhancedVoiceRoom } from '@/components/room';
import { useAuth } from '@/lib/hooks/use-auth';
import { api } from '@/lib/api';
import type { RoomData, RoomParticipant } from '@/components/room/types';

interface RoomContentProps {
    roomId: string;
}

/**
 * Room Content Component
 * 
 * This component handles:
 * 1. Fetching room data
 * 2. Wrapping content with VoiceProvider
 * 3. Rendering VoiceRoom with proper data
 */
export function RoomContent({ roomId }: RoomContentProps) {
    const [room, setRoom] = useState<RoomData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const router = useRouter();
    const { user, isAuthenticated, isInitialized } = useAuth();

    // Redirect if not authenticated
    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login');
        }
    }, [isInitialized, isAuthenticated, router]);

    // Fetch room data
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        let isMounted = true;

        const fetchRoom = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch room from API
                const response = await api.get(`/rooms/${roomId}`);
                const roomData = response.data.data || response.data;

                if (!isMounted) return;

                // Check if room exists
                if (!roomData || !roomData.id) {
                    throw new Error('Room not found');
                }

                // Transform API response to RoomData format
                const transformedRoom: RoomData = {
                    id: roomData.id,
                    name: roomData.name,
                    topic: roomData.topic,
                    languages: roomData.languages || [],
                    maxParticipants: roomData.maxParticipants,
                    ownerId: roomData.ownerId,
                    isActive: roomData.isActive !== false, // Default to active if not specified
                    participants: (roomData.participants || []).map((p: any) => ({
                        id: p.userId || p.id,
                        username: p.user?.username || p.username || 'Unknown',
                        displayName: p.user?.displayName || p.displayName || null,
                        avatarUrl: p.user?.avatarUrl || p.avatarUrl || null,
                        isOwner: p.userId === roomData.ownerId || p.id === roomData.ownerId,
                        isMuted: true, // Default to muted
                        isDeafened: false,
                        isSpeaking: false,
                        audioLevel: 0,
                        joinedAt: p.joinedAt || new Date().toISOString(),
                    })),
                    createdAt: roomData.createdAt,
                };

                setRoom(transformedRoom);
            } catch (err: any) {
                if (!isMounted) return;
                console.error('Failed to fetch room:', err);

                // Determine error type
                const status = err?.response?.status;
                const message = err?.response?.data?.message || err?.message || 'Failed to load room';

                // Create appropriate error message based on status
                let errorMessage = message;
                if (status === 404 || message.includes('not found')) {
                    errorMessage = 'Room not found';
                } else if (status === 410) {
                    errorMessage = 'This room has been closed';
                } else if (status === 403) {
                    errorMessage = 'You do not have access to this room';
                }

                setError(err instanceof Error ? new Error(errorMessage) : new Error(errorMessage));
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchRoom();

        return () => {
            isMounted = false;
        };
    }, [roomId, isAuthenticated, user]);

    // Handle leave callback
    const handleLeave = useCallback(() => {
        // Additional cleanup if needed
        console.log('Left room:', roomId);
    }, [roomId]);

    // Handle room closed callback
    const handleRoomClosed = useCallback(() => {
        router.push('/');
    }, [router]);

    // Determine if current user is owner
    const isOwner = useMemo(() => {
        return room?.ownerId === user?.id;
    }, [room, user]);

    // Current user ID
    const currentUserId = user?.id || '';

    // Show loading while checking auth
    if (!isInitialized || isLoading) {
        return <LoadingState />;
    }

    // Error state
    if (error || !room) {
        return (
            <ErrorState
                error={error || new Error('Room not found')}
                onRetry={() => window.location.reload()}
                errorType={error?.message.includes('closed') ? 'closed' : 'not-found'}
            />
        );
    }

    // Check if room is active
    if (room.isActive === false) {
        return (
            <ErrorState
                error={new Error('This room has been closed by the owner')}
                onRetry={() => { }}
                errorType="closed"
            />
        );
    }

    return (
        <VoiceProvider debug>
            <div className="h-screen bg-background-primary">
                <EnhancedVoiceRoom
                    room={room}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    onLeave={handleLeave}
                    onRoomClosed={handleRoomClosed}
                />
            </div>
        </VoiceProvider>
    );
}

/**
 * Loading state component
 */
const LoadingState = memo(function LoadingState() {
    return (
        <div className="flex flex-col h-screen bg-background-primary">
            {/* Skeleton Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-background-secondary/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-default animate-pulse" />
                    <div>
                        <div className="h-5 w-32 bg-surface-default rounded animate-pulse" />
                        <div className="h-4 w-20 bg-surface-default rounded mt-1 animate-pulse" />
                    </div>
                </div>
            </header>

            {/* Loading Spinner */}
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                    <p className="text-text-secondary">Loading room...</p>
                </div>
            </div>
        </div>
    );
});

/**
 * Error state component
 */
const ErrorState = memo(function ErrorState({
    error,
    onRetry,
    errorType = 'not-found',
}: {
    error: Error;
    onRetry: () => void;
    errorType?: 'not-found' | 'closed';
}) {
    const router = useRouter();

    const errorConfig = {
        'not-found': {
            title: 'Room not found',
            description: 'The room you are looking for does not exist or has been deleted.',
            icon: AlertCircle,
            showRetry: true,
            action: 'Go Home',
        },
        'closed': {
            title: 'Room is closed',
            description: 'This room has been closed by the owner and is no longer available.',
            icon: AlertCircle,
            showRetry: false,
            action: 'Back to Rooms',
        },
    }[errorType];

    return (
        <div className="flex flex-col h-screen bg-background-primary">
            {/* Header */}
            <header className="flex items-center px-4 py-3 border-b border-surface-border bg-background-secondary/50">
                <Link
                    href="/"
                    className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
            </header>

            {/* Error Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-status-error/20 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-status-error" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-text-primary">{errorConfig.title}</h2>
                        <p className="text-text-secondary mt-1">{errorConfig.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                        >
                            {errorConfig.action}
                        </Button>
                        {errorConfig.showRetry && (
                            <Button
                                variant="primary"
                                onClick={onRetry}
                            >
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

LoadingState.displayName = 'LoadingState';
ErrorState.displayName = 'ErrorState';
