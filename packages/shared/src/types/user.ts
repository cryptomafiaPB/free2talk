export interface User {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    nativeLanguages: string[];
    learningLanguages: string[];
    isOnline: boolean;
    lastSeenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile extends Omit<User, 'email'> {
    // Public profile without sensitive info
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
    username: string
}