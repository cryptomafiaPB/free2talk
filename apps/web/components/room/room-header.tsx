/**
 * Room Header Component
 * 
 * Displays room info, participant count, and action buttons.
 */

'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { Button, LanguageBadge } from '@/components/ui';
import {
    ChevronLeft,
    Users,
    MoreVertical,
    LogOut,
    Crown,
    Trash2,
} from '@/components/ui/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/primitives';
import type { RoomData } from './types';

export interface RoomHeaderProps {
    /** Room data */
    room: RoomData;
    /** Current participant count */
    participantCount: number;
    /** Whether the current user is the owner */
    isOwner: boolean;
    /** Connection status indicator */
    connectionStatus?: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
    /** Callback when close room is clicked (owner only) */
    onCloseRoom?: () => void;
    /** Custom class name */
    className?: string;
}

/**
 * Memoized room header
 */
export const RoomHeader = memo(function RoomHeader({
    room,
    participantCount,
    isOwner,
    connectionStatus = 'connected',
    onCloseRoom,
    className,
}: RoomHeaderProps) {
    const handleCloseRoom = useCallback(() => {
        if (confirm('Are you sure you want to close this room? All participants will be disconnected.')) {
            onCloseRoom?.();
        }
    }, [onCloseRoom]);

    return (
        <header className={cn(
            'flex items-center justify-between px-4 py-3 border-b border-surface-border bg-background-secondary/50 backdrop-blur-xl',
            className
        )}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Back Button */}
                <Link
                    href="/"
                    className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors flex-shrink-0"
                    aria-label="Back to rooms"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>

                {/* Room Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="font-semibold text-text-primary truncate">
                            {room.name}
                        </h1>
                        <ConnectionIndicator status={connectionStatus} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {room.languages.slice(0, 3).map((lang) => (
                            <LanguageBadge key={lang} language={lang} size="sm" />
                        ))}
                        {room.languages.length > 3 && (
                            <span className="text-xs text-text-tertiary">
                                +{room.languages.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {/* Participant Count */}
                <Button variant="ghost" size="iconSm" className="pointer-events-none">
                    <Users className="h-4 w-4" />
                    <span className="text-xs ml-1 tabular-nums">
                        {participantCount}/{room.maxParticipants}
                    </span>
                </Button>

                {/* More Options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="iconSm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href="/" className="flex items-center">
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave Room
                            </Link>
                        </DropdownMenuItem>

                        {isOwner && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleCloseRoom}
                                    className="text-danger-500 focus:text-danger-500"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Close Room
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
});

/**
 * Connection status indicator
 */
const ConnectionIndicator = memo(function ConnectionIndicator({
    status,
}: {
    status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
}) {
    const statusConfig = {
        connected: {
            color: 'bg-status-success',
            label: 'Connected',
            animate: false,
        },
        connecting: {
            color: 'bg-status-warning',
            label: 'Connecting...',
            animate: true,
        },
        reconnecting: {
            color: 'bg-status-warning',
            label: 'Reconnecting...',
            animate: true,
        },
        disconnected: {
            color: 'bg-status-error',
            label: 'Disconnected',
            animate: false,
        },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-1.5" title={config.label}>
            <span
                className={cn(
                    'w-2 h-2 rounded-full',
                    config.color,
                    config.animate && 'animate-pulse'
                )}
            />
            {status !== 'connected' && (
                <span className="text-xs text-text-secondary">{config.label}</span>
            )}
        </div>
    );
});

/**
 * Room topic bar (shown below header when topic exists)
 */
export const RoomTopicBar = memo(function RoomTopicBar({
    topic,
    className,
}: {
    topic: string;
    className?: string;
}) {
    return (
        <div className={cn(
            'px-4 py-2 bg-surface-default/50 border-b border-surface-borderSubtle',
            className
        )}>
            <p className="text-sm text-text-secondary line-clamp-2">{topic}</p>
        </div>
    );
});

RoomHeader.displayName = 'RoomHeader';
ConnectionIndicator.displayName = 'ConnectionIndicator';
RoomTopicBar.displayName = 'RoomTopicBar';
