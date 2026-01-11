'use client';

import Link from 'next/link';
import { cn } from '@/lib/design-system';
import { Card } from './card';
import { Avatar, AvatarGroup } from './avatar';
import { LanguageBadge, ParticipantBadge } from './badge';
import { Mic, VoiceWaveIcon } from './icons';

export interface RoomCardProps {
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
    participants?: Array<{
        id: string;
        username: string;
        avatarUrl?: string;
        isSpeaking?: boolean;
    }>;
    isLive?: boolean;
}

export function RoomCard({
    id,
    name,
    topic,
    languages,
    participantCount,
    maxParticipants,
    owner,
    participants = [],
    isLive = true,
}: RoomCardProps) {
    const isFull = participantCount >= maxParticipants;

    return (
        <Link href={`/rooms/${id}`}>
            <Card
                variant="interactive"
                padding="none"
                className={cn(
                    'overflow-hidden group',
                    isFull && 'opacity-75'
                )}
            >
                {/* Top section with gradient */}
                <div className="relative p-4 pb-3">
                    {/* Live indicator */}
                    {isLive && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <VoiceWaveIcon className="h-4 w-4 text-voice-speaking" />
                        </div>
                    )}

                    {/* Languages */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {languages.slice(0, 2).map((lang) => (
                            <LanguageBadge key={lang} language={lang} size="sm" />
                        ))}
                        {languages.length > 2 && (
                            <span className="text-xs text-text-tertiary">+{languages.length - 2}</span>
                        )}
                    </div>

                    {/* Room name */}
                    <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-primary-400 transition-colors">
                        {name}
                    </h3>

                    {/* Topic */}
                    {topic && (
                        <p className="text-sm text-text-secondary line-clamp-1 mt-0.5">
                            {topic}
                        </p>
                    )}
                </div>

                {/* Bottom section */}
                <div className="px-4 py-3 bg-surface-hover/50 border-t border-surface-borderSubtle">
                    <div className="flex items-center justify-between">
                        {/* Owner & Participants */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Avatar
                                    src={owner.avatarUrl}
                                    alt={owner.displayName || owner.username}
                                    fallback={owner.displayName || owner.username}
                                    size="xs"
                                />
                                <span className="text-xs text-text-secondary truncate max-w-[80px]">
                                    {owner.displayName || owner.username}
                                </span>
                            </div>

                            {/* Other participants */}
                            {participants.length > 0 && (
                                <AvatarGroup
                                    avatars={participants.map(p => ({
                                        src: p.avatarUrl,
                                        alt: p.username,
                                        fallback: p.username,
                                    }))}
                                    max={3}
                                    size="xs"
                                />
                            )}
                        </div>

                        {/* Participant count */}
                        <ParticipantBadge count={participantCount} max={maxParticipants} size="sm" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}

// Compact room card for lists
export function RoomCardCompact({
    id,
    name,
    topic,
    languages,
    participantCount,
    maxParticipants,
    owner,
    isLive = true,
}: RoomCardProps) {
    const isFull = participantCount >= maxParticipants;

    return (
        <Link href={`/rooms/${id}`}>
            <Card
                variant="interactive"
                padding="sm"
                className={cn(
                    'flex items-center gap-3',
                    isFull && 'opacity-75'
                )}
            >
                {/* Avatar */}
                <Avatar
                    src={owner.avatarUrl}
                    alt={owner.displayName || owner.username}
                    fallback={owner.displayName || owner.username}
                    size="lg"
                    status={isLive ? 'speaking' : 'online'}
                    showStatus
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-text-primary truncate">
                            {name}
                        </h3>
                        {isLive && <VoiceWaveIcon className="h-4 w-4 text-voice-speaking flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-tertiary">
                            {owner.displayName || owner.username}
                        </span>
                        <span className="text-text-tertiary">·</span>
                        <div className="flex gap-1">
                            {languages.slice(0, 2).map((lang) => (
                                <LanguageBadge key={lang} language={lang} size="sm" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Count */}
                <ParticipantBadge count={participantCount} max={maxParticipants} size="sm" />
            </Card>
        </Link>
    );
}

// Skeleton loader for room cards
export function RoomCardSkeleton() {
    return (
        <Card variant="default" padding="none" className="overflow-hidden">
            <div className="p-4 pb-3 space-y-3">
                <div className="flex gap-2">
                    <div className="h-5 w-12 bg-surface-hover rounded animate-pulse" />
                    <div className="h-5 w-14 bg-surface-hover rounded animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-surface-hover rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-surface-hover rounded animate-pulse" />
            </div>
            <div className="px-4 py-3 bg-surface-hover/50 border-t border-surface-borderSubtle">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-surface-hover rounded-full animate-pulse" />
                        <div className="h-4 w-20 bg-surface-hover rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-12 bg-surface-hover rounded animate-pulse" />
                </div>
            </div>
        </Card>
    );
}
