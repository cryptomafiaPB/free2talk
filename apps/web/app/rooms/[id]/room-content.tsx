'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from '@/components/ui/icons';

interface RoomContentProps {
    roomId: string;
}

// Mock room data
const mockRoom = {
    id: '1',
    name: 'English Practice 🌟',
    topic: 'Casual conversation for beginners',
    languages: ['English', 'Spanish'],
    maxParticipants: 12,
    owner: {
        id: 'u1',
        username: 'sarah_m',
        displayName: 'Sarah',
    },
};

const mockParticipants = [
    { id: 'u1', username: 'sarah_m', displayName: 'Sarah', role: 'owner', isMuted: false, isSpeaking: true },
    { id: 'u2', username: 'alex_m', displayName: 'Alex', role: 'participant', isMuted: false, isSpeaking: false },
    { id: 'u3', username: 'maria_g', displayName: 'Maria', role: 'participant', isMuted: true, isSpeaking: false },
    { id: 'u4', username: 'john_d', displayName: 'John', role: 'participant', isMuted: false, isSpeaking: false },
];

export function RoomContent({ roomId }: RoomContentProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [isDeafened, setIsDeafened] = useState(false);
    const currentUserId = 'u2'; // Mock current user

    const room = mockRoom;
    const participants = mockParticipants;

    return (
        <div className="flex flex-col h-screen bg-background-primary">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-background-secondary/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="font-semibold text-text-primary line-clamp-1">{room.name}</h1>
                        <div className="flex items-center gap-2">
                            {room.languages.map((lang) => (
                                <LanguageBadge key={lang} language={lang} size="sm" />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="iconSm">
                        <Users className="h-4 w-4" />
                        <span className="text-xs ml-1">{participants.length}</span>
                    </Button>
                    <Button variant="ghost" size="iconSm">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Room Topic */}
            {room.topic && (
                <div className="px-4 py-2 bg-surface-default/50 border-b border-surface-borderSubtle">
                    <p className="text-sm text-text-secondary">{room.topic}</p>
                </div>
            )}

            {/* Participants Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {participants.map((participant) => (
                        <ParticipantCard
                            key={participant.id}
                            participant={participant}
                            isCurrentUser={participant.id === currentUserId}
                        />
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: room.maxParticipants - participants.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="aspect-square rounded-2xl border-2 border-dashed border-surface-border flex items-center justify-center"
                        >
                            <Users className="h-8 w-8 text-text-tertiary/50" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="border-t border-surface-border bg-background-secondary/80 backdrop-blur-xl">
                <div className="flex items-center justify-center gap-4 px-4 py-4 safe-area-bottom">
                    {/* Mute Button */}
                    <Button
                        variant={isMuted ? 'danger' : 'secondary'}
                        size="icon"
                        className="h-14 w-14 rounded-full"
                        onClick={() => setIsMuted(!isMuted)}
                    >
                        {isMuted ? (
                            <MicOff className="h-6 w-6" />
                        ) : (
                            <Mic className="h-6 w-6" />
                        )}
                    </Button>

                    {/* Deafen Button */}
                    <Button
                        variant={isDeafened ? 'danger' : 'ghost'}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setIsDeafened(!isDeafened)}
                    >
                        {isDeafened ? (
                            <VolumeX className="h-5 w-5" />
                        ) : (
                            <Volume2 className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Leave Button */}
                    <Link href="/">
                        <Button
                            variant="danger"
                            size="icon"
                            className="h-14 w-14 rounded-full bg-status-error"
                        >
                            <Phone className="h-6 w-6 rotate-[135deg]" />
                        </Button>
                    </Link>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface ParticipantCardProps {
    participant: {
        id: string;
        username: string;
        displayName: string;
        role: string;
        isMuted: boolean;
        isSpeaking: boolean;
    };
    isCurrentUser: boolean;
}

function ParticipantCard({ participant, isCurrentUser }: ParticipantCardProps) {
    const isOwner = participant.role === 'owner';

    return (
        <Card
            variant="interactive"
            padding="sm"
            className={cn(
                'aspect-square flex flex-col items-center justify-center gap-2 relative',
                participant.isSpeaking && 'ring-2 ring-voice-speaking'
            )}
        >
            {/* Owner Badge */}
            {isOwner && (
                <div className="absolute top-2 left-2">
                    <Crown className="h-4 w-4 text-status-warning" />
                </div>
            )}

            {/* You Badge */}
            {isCurrentUser && (
                <span className="absolute top-2 right-2 text-[10px] text-primary-400 font-medium">
                    You
                </span>
            )}

            {/* Avatar */}
            <Avatar
                fallback={participant.displayName}
                size="xl"
                status={participant.isSpeaking ? 'speaking' : participant.isMuted ? 'muted' : 'online'}
                showStatus
            />

            {/* Name */}
            <p className="text-sm font-medium text-text-primary truncate max-w-full px-2">
                {participant.displayName}
            </p>

            {/* Mute indicator */}
            {participant.isMuted && (
                <div className="absolute bottom-2 right-2 p-1 rounded-full bg-surface-default">
                    <MicOff className="h-3 w-3 text-voice-muted" />
                </div>
            )}
        </Card>
    );
}
