'use client';

import { useState } from 'react';
import {
    Section,
    RoomCard,
    RoomCardSkeleton,
    RoomFilters,
    EmptyState,
    Button,
} from '@/components/ui';
import { Plus, Users } from '@/components/ui/icons';
import Link from 'next/link';

// Mock data for rooms - this would come from API
const mockRooms = [
    {
        id: '1',
        name: 'English Practice 🌟',
        topic: 'Casual conversation for beginners',
        languages: ['English', 'Spanish'],
        participantCount: 5,
        maxParticipants: 12,
        owner: {
            id: 'u1',
            username: 'sarah_m',
            displayName: 'Sarah',
            avatarUrl: undefined,
        },
        participants: [
            { id: 'p1', username: 'alex', isSpeaking: true },
            { id: 'p2', username: 'maria' },
            { id: 'p3', username: 'john' },
        ],
        isLive: true,
    },
    {
        id: '2',
        name: 'Japanese Learners 日本語',
        topic: 'N3-N2 level practice',
        languages: ['Japanese', 'English'],
        participantCount: 8,
        maxParticipants: 10,
        owner: {
            id: 'u2',
            username: 'yuki_t',
            displayName: 'Yuki',
            avatarUrl: undefined,
        },
        participants: [
            { id: 'p4', username: 'ken', isSpeaking: false },
            { id: 'p5', username: 'lisa' },
        ],
        isLive: true,
    },
    {
        id: '3',
        name: 'French Corner 🇫🇷',
        topic: 'Let\'s talk about movies!',
        languages: ['French', 'English'],
        participantCount: 3,
        maxParticipants: 8,
        owner: {
            id: 'u3',
            username: 'pierre',
            displayName: 'Pierre',
            avatarUrl: undefined,
        },
        participants: [],
        isLive: true,
    },
    {
        id: '4',
        name: 'Spanish Conversation',
        topic: 'Travel stories and experiences',
        languages: ['Spanish'],
        participantCount: 6,
        maxParticipants: 12,
        owner: {
            id: 'u4',
            username: 'carlos_r',
            displayName: 'Carlos',
            avatarUrl: undefined,
        },
        participants: [
            { id: 'p6', username: 'emma' },
            { id: 'p7', username: 'david' },
            { id: 'p8', username: 'sophie' },
            { id: 'p9', username: 'michael' },
        ],
        isLive: true,
    },
    {
        id: '5',
        name: 'Korean Drama Chat 🎬',
        topic: 'Discussing K-dramas in Korean',
        languages: ['Korean', 'English'],
        participantCount: 4,
        maxParticipants: 8,
        owner: {
            id: 'u5',
            username: 'minjae',
            displayName: 'Minjae',
            avatarUrl: undefined,
        },
        participants: [
            { id: 'p10', username: 'anna' },
        ],
        isLive: true,
    },
    {
        id: '6',
        name: 'German Beginners',
        topic: 'A1-A2 friendly space',
        languages: ['German', 'English'],
        participantCount: 2,
        maxParticipants: 6,
        owner: {
            id: 'u6',
            username: 'hans',
            displayName: 'Hans',
            avatarUrl: undefined,
        },
        participants: [],
        isLive: true,
    },
];

export function RoomsContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [rooms, setRooms] = useState(mockRooms);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        // Filter rooms based on search query
        if (query) {
            setRooms(
                mockRooms.filter(
                    (room) =>
                        room.name.toLowerCase().includes(query.toLowerCase()) ||
                        room.topic?.toLowerCase().includes(query.toLowerCase()) ||
                        room.languages.some((l) => l.toLowerCase().includes(query.toLowerCase()))
                )
            );
        } else {
            setRooms(mockRooms);
        }
    };

    const activeRoomsCount = rooms.filter(r => r.isLive).length;
    const totalParticipants = rooms.reduce((acc, r) => acc + r.participantCount, 0);

    return (
        <div className="space-y-6">
            {/* Stats - Mobile */}
            <div className="flex items-center gap-4 text-sm md:hidden">
                <div className="flex items-center gap-1.5 text-text-secondary">
                    <div className="h-2 w-2 rounded-full bg-voice-speaking animate-pulse" />
                    <span>{activeRoomsCount} active rooms</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                    <Users className="h-4 w-4" />
                    <span>{totalParticipants} people talking</span>
                </div>
            </div>

            {/* Filters */}
            <RoomFilters onSearch={handleSearch} />

            {/* Room Grid */}
            <Section>
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RoomCardSkeleton key={i} />
                        ))}
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((room) => (
                            <RoomCard key={room.id} {...room} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Users className="h-12 w-12" />}
                        title="No rooms found"
                        description={
                            searchQuery
                                ? `No rooms match "${searchQuery}". Try a different search.`
                                : 'Be the first to create a room and start practicing!'
                        }
                        action={
                            <Button asChild>
                                <Link href="/rooms/create">
                                    <Plus className="h-4 w-4" />
                                    Create Room
                                </Link>
                            </Button>
                        }
                    />
                )}
            </Section>
        </div>
    );
}
