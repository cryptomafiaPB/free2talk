'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import {
    useInfiniteScroll,
    useHallwaySocket,
    useToast,
    type RoomSummary,
} from '@/lib/hooks';
import {
    Section,
    RoomCard,
    RoomCardSkeleton,
    Button,
    Input,
} from '@/components/ui';
import {
    Plus,
    Users,
    Search,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
} from '@/components/ui/icons';

interface ApiRoom {
    id: string;
    name: string;
    slug: string;
    topic?: string;
    languages: string[];
    participantCount: number;
    maxParticipants: number;
    ownerId: string;
    owner: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    isActive: boolean;
    createdAt: string;
}

interface RoomListItem {
    id: string;
    name: string;
    topic?: string;
    languages: string[];
    participantCount: number;
    maxParticipants: number;
    owner: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    participants: Array<{
        id: string;
        username: string;
        avatarUrl?: string;
        isSpeaking?: boolean;
    }>;
    isLive: boolean;
}

const PAGE_SIZE = 12;

export function HallwayContent() {
    const { isAuthenticated } = useAuth();
    const { room: roomToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    // Fetch function for infinite scroll
    const fetchRooms = useCallback(async (page: number) => {
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
            });
            if (selectedLanguage) {
                params.set('language', selectedLanguage);
            }

            const response = await api.get(`/rooms?${params}`);
            const data = response.data.data;

            // Transform API response to our format
            const rooms: RoomListItem[] = data.rooms.map((room: ApiRoom) => ({
                id: room.id,
                name: room.name,
                topic: room.topic,
                languages: room.languages || [],
                participantCount: room.participantCount,
                maxParticipants: room.maxParticipants,
                owner: room.owner,
                participants: [], // Will be populated by real-time updates
                isLive: room.isActive,
            }));

            return {
                data: rooms,
                hasMore: page < data.totalPages,
                total: data.total,
            };
        } catch (error: any) {
            console.error('[Hallway] Failed to fetch rooms:', error);
            // Return empty data on error instead of throwing
            return {
                data: [],
                hasMore: false,
                total: 0,
            };
        }
    }, [selectedLanguage]);

    // Infinite scroll hook
    const {
        items: rooms,
        isLoading,
        isInitialLoading,
        hasMore,
        total,
        error,
        sentinelRef,
        reset,
        prepend,
        updateItem,
        removeItem,
    } = useInfiniteScroll<RoomListItem>({
        fetchFn: fetchRooms,
        pageSize: PAGE_SIZE,
        deps: [selectedLanguage],
    });

    // Real-time socket updates
    const { isSubscribed, isConnected, isConnecting } = useHallwaySocket({
        onRoomCreated: useCallback((room: RoomSummary) => {
            // Prepend new room to the list
            prepend([{
                id: room.id,
                name: room.name,
                topic: room.topic,
                languages: room.languages,
                participantCount: room.participantCount,
                maxParticipants: room.maxParticipants,
                owner: {
                    id: room.ownerId,
                    username: room.ownerName,
                    avatarUrl: room.ownerAvatarUrl,
                },
                participants: [],
                isLive: true,
            }]);
        }, [prepend]),

        onRoomUpdated: useCallback((room: RoomSummary) => {
            updateItem(
                (item) => item.id === room.id,
                (item) => ({
                    ...item,
                    name: room.name,
                    topic: room.topic,
                    languages: room.languages,
                    participantCount: room.participantCount,
                    maxParticipants: room.maxParticipants,
                })
            );
        }, [updateItem]),

        onRoomClosed: useCallback((roomId: string) => {
            removeItem((item) => item.id === roomId);
        }, [removeItem]),
    });

    // Filter rooms by search query (client-side)
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;
        const query = searchQuery.toLowerCase();
        return rooms.filter(
            (room) =>
                room.name.toLowerCase().includes(query) ||
                room.topic?.toLowerCase().includes(query) ||
                room.languages.some((l) => l.toLowerCase().includes(query)) ||
                room.owner.username.toLowerCase().includes(query)
        );
    }, [rooms, searchQuery]);

    // Stats
    const activeRoomsCount = total ?? rooms.length;
    const totalParticipants = rooms.reduce((acc, r) => acc + r.participantCount, 0);

    // Handle search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle refresh
    const handleRefresh = () => {
        reset();
    };

    // Determine connection status display
    const connectionStatusDisplay = useMemo(() => {
        if (isConnected && isSubscribed) {
            return { icon: Wifi, text: 'Live', color: 'text-status-success' };
        }
        if (isConnecting) {
            return { icon: Loader2, text: 'Connecting...', color: 'text-status-warning', animate: true };
        }
        return { icon: WifiOff, text: 'Offline', color: 'text-text-tertiary' };
    }, [isConnected, isSubscribed, isConnecting]);

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                        <div className="h-2 w-2 rounded-full bg-voice-speaking animate-pulse" />
                        <span>{activeRoomsCount} active room{activeRoomsCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-secondary">
                        <Users className="h-4 w-4" />
                        <span>{totalParticipants} people talking</span>
                    </div>
                    {/* Connection status */}
                    <div className={cn(
                        'flex items-center gap-1.5 text-xs',
                        connectionStatusDisplay.color
                    )}>
                        <connectionStatusDisplay.icon
                            className={cn(
                                'h-3.5 w-3.5',
                                connectionStatusDisplay.animate && 'animate-spin'
                            )}
                        />
                        <span className="hidden sm:inline">
                            {connectionStatusDisplay.text}
                        </span>
                    </div>
                </div>

                {/* Create room button */}
                {isAuthenticated && (
                    <Button asChild size="sm" className="w-full sm:w-auto">
                        <Link href="/rooms/create">
                            <Plus className="h-4 w-4" />
                            Create Room
                        </Link>
                    </Button>
                )}
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input
                        placeholder="Search rooms, languages, topics..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="shrink-0"
                >
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-4 text-center">
                    <p className="text-status-error text-sm">
                        Failed to load rooms. Please try again.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="mt-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Room Grid */}
            <Section>
                {isInitialLoading ? (
                    // Initial loading skeleton
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RoomCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredRooms.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRooms.map((room) => (
                                <RoomCard key={room.id} {...room} />
                            ))}
                        </div>

                        {/* Infinite scroll sentinel */}
                        {hasMore && !searchQuery && (
                            <div
                                ref={sentinelRef}
                                className="flex justify-center py-8"
                            >
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-text-secondary">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-sm">Loading more rooms...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* End of list */}
                        {!hasMore && rooms.length > PAGE_SIZE && (
                            <div className="text-center py-8 text-text-tertiary text-sm">
                                You&apos;ve seen all {total} rooms
                            </div>
                        )}
                    </>
                ) : (
                    // Empty state
                    <EmptyState
                        searchQuery={searchQuery}
                        isAuthenticated={isAuthenticated}
                        onClearSearch={() => setSearchQuery('')}
                    />
                )}
            </Section>
        </div>
    );
}

// Empty state component
function EmptyState({
    searchQuery,
    isAuthenticated,
    onClearSearch,
}: {
    searchQuery: string;
    isAuthenticated: boolean;
    onClearSearch: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-text-tertiary" />
            </div>

            <h3 className="text-lg font-semibold text-text-primary mb-2">
                {searchQuery ? 'No rooms found' : 'No active rooms'}
            </h3>

            <p className="text-text-secondary text-sm max-w-md mb-6">
                {searchQuery
                    ? `No rooms match "${searchQuery}". Try a different search or create a new room.`
                    : 'Be the first to create a room and start practicing!'
                }
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                {searchQuery && (
                    <Button variant="outline" onClick={onClearSearch}>
                        Clear Search
                    </Button>
                )}
                {isAuthenticated && (
                    <Button asChild>
                        <Link href="/rooms/create">
                            <Plus className="h-4 w-4" />
                            Create Room
                        </Link>
                    </Button>
                )}
                {!isAuthenticated && (
                    <Button asChild>
                        <Link href="/login">
                            Sign in to Create Room
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
