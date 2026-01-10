export interface Room {
    id: string;
    name: string;
    slug?: string;
    ownerId: string;
    topic?: string;
    languages: string[];
    maxParticipants: number;
    isActive: boolean;
    createdAt: Date;
    closedAt?: Date;
}

export interface RoomSummary {
    id: string;
    name: string;
    topic?: string;
    languages: string[];
    participantCount: number;
    maxParticipants: number;
    ownerId: string;
    ownerName: string;
}

export interface Participant {
    id: string;
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    role: 'owner' | 'participant';
    isMuted: boolean;
    isSpeaking: boolean;
    joinedAt: Date;
}

export interface CreateRoomInput {
    name: string;
    topic?: string;
    languages: string[];
    maxParticipants: number;
}

export interface RoomParticipant {
    id: string;
    roomId: string;
    userId: string;
    role: 'owner' | 'participant';
    joinedAt: Date;
    leftAt?: Date;
}
