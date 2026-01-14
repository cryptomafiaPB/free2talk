/**
 * Public Profile Content
 * 
 * Displays another user's public profile.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    Avatar,
    Button,
    Badge,
    Skeleton,
} from '@/components/ui';
import {
    Users,
    Clock,
    Calendar,
    ArrowLeft,
    Phone,
    Mic,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/design-system';
import { profileService, type ProfileWithStats } from '@/lib/services/profile.service';
import { useAuthStore } from '@/lib/stores';

// ==================== Constants ====================

const LANGUAGE_FLAGS: Record<string, string> = {
    english: '🇺🇸',
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
    italian: '🇮🇹',
    portuguese: '🇵🇹',
    russian: '🇷🇺',
    japanese: '🇯🇵',
    korean: '🇰🇷',
    chinese: '🇨🇳',
    arabic: '🇸🇦',
    hindi: '🇮🇳',
    turkish: '🇹🇷',
    vietnamese: '🇻🇳',
    thai: '🇹🇭',
    dutch: '🇳🇱',
    polish: '🇵🇱',
    swedish: '🇸🇪',
    norwegian: '🇳🇴',
    danish: '🇩🇰',
    finnish: '🇫🇮',
    greek: '🇬🇷',
    czech: '🇨🇿',
    romanian: '🇷🇴',
    hungarian: '🇭🇺',
    ukrainian: '🇺🇦',
    indonesian: '🇮🇩',
    malay: '🇲🇾',
    tagalog: '🇵🇭',
    hebrew: '🇮🇱',
};

function getLanguageFlag(language: string): string {
    const key = language.toLowerCase().trim();
    return LANGUAGE_FLAGS[key] || '🌐';
}

// ==================== Props ====================

interface PublicProfileContentProps {
    username: string;
}

// ==================== Main Component ====================

export function PublicProfileContent({ username }: PublicProfileContentProps) {
    const { user: currentUser } = useAuthStore();
    const [profile, setProfile] = useState<ProfileWithStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if viewing own profile
    const isOwnProfile = currentUser?.username?.toLowerCase() === username.toLowerCase();

    useEffect(() => {
        async function fetchProfile() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await profileService.getProfileByUsername(username);
                setProfile(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'User not found');
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfile();
    }, [username]);

    if (isLoading) {
        return <PublicProfileSkeleton />;
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    User Not Found
                </h2>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                    We couldn&apos;t find a user with the username &quot;{username}&quot;.
                    They may have changed their username or the account doesn&apos;t exist.
                </p>
                <Button asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Home
                    </Link>
                </Button>
            </div>
        );
    }

    const { profile: userData, stats } = profile;

    // Redirect to own profile page if viewing self
    if (isOwnProfile) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="text-6xl mb-4">👋</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    This is your profile!
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                    View and edit your profile from your profile page.
                </p>
                <Button asChild>
                    <Link href="/profile">Go to My Profile</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back
                </Link>
            </Button>

            {/* Profile Header Card */}
            <Card className="overflow-hidden border-0 bg-linear-to-br from-secondary-500/10 via-background to-background">
                <CardContent className="p-0">
                    {/* Banner */}
                    <div className="h-24 sm:h-32 bg-linear-to-r from-secondary-600 via-secondary-500 to-secondary-400" />

                    {/* Profile Info */}
                    <div className="px-4 sm:px-6 pb-6">
                        {/* Avatar - overlapping banner */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
                            <Avatar
                                src={userData.avatarUrl ?? undefined}
                                fallback={userData.displayName || userData.username}
                                size="2xl"
                                className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl"
                            />

                            {/* Name & Online Status */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                        {userData.displayName || userData.username}
                                    </h1>
                                    {userData.isOnline && (
                                        <Badge variant="success" className="text-xs">
                                            Online
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">@{userData.username}</p>
                            </div>
                        </div>

                        {/* Bio */}
                        {userData.bio && (
                            <p className="mt-4 text-foreground/80 max-w-2xl">
                                {userData.bio}
                            </p>
                        )}

                        {/* Languages */}
                        <div className="mt-4 flex flex-wrap gap-4">
                            {userData.nativeLanguages && userData.nativeLanguages.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                        Native
                                    </span>
                                    {userData.nativeLanguages.map((lang) => (
                                        <Badge key={lang} variant="secondary" className="gap-1">
                                            {getLanguageFlag(lang)} {lang}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {userData.learningLanguages && userData.learningLanguages.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                        Learning
                                    </span>
                                    {userData.learningLanguages.map((lang) => (
                                        <Badge key={lang} variant="outline" className="gap-1">
                                            {getLanguageFlag(lang)} {lang}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Member Since & Last Seen */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {formatDate(userData.createdAt)}</span>
                            </div>
                            {!userData.isOnline && userData.lastSeenAt && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Last seen {formatRelativeTime(userData.lastSeenAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    value={formatMinutes(stats.totalPracticeMinutes)}
                    label="Practice Time"
                    color="secondary"
                />
                <StatCard
                    icon={<Users className="h-5 w-5" />}
                    value={stats.roomsJoined}
                    label="Rooms Joined"
                    color="blue"
                />
                <StatCard
                    icon={<Phone className="h-5 w-5" />}
                    value={stats.randomCallsCompleted}
                    label="Random Calls"
                    color="green"
                />
                <StatCard
                    icon={<Mic className="h-5 w-5" />}
                    value={stats.roomsCreated}
                    label="Rooms Created"
                    color="purple"
                />
            </div>

            {/* Shared Languages Hint */}
            <SharedLanguagesHint
                currentUser={currentUser}
                profileUser={userData}
            />
        </div>
    );
}

// ==================== Stat Card ====================

interface StatCardProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    color?: 'primary' | 'secondary' | 'blue' | 'green' | 'purple';
}

function StatCard({ icon, value, label, color = 'primary' }: StatCardProps) {
    const colorClasses = {
        primary: 'text-primary-500 bg-primary-500/10',
        secondary: 'text-secondary-500 bg-secondary-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        green: 'text-green-500 bg-green-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    };

    return (
        <Card className="border-0 bg-card/50">
            <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={cn('p-2.5 rounded-xl mb-2', colorClasses[color])}>
                    {icon}
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                    {value}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {label}
                </span>
            </CardContent>
        </Card>
    );
}

// ==================== Shared Languages Hint ====================

interface SharedLanguagesHintProps {
    currentUser: { nativeLanguages?: string[] | null; learningLanguages?: string[] | null } | null;
    profileUser: { nativeLanguages: string[] | null; learningLanguages: string[] | null; displayName: string | null; username: string };
}

function SharedLanguagesHint({ currentUser, profileUser }: SharedLanguagesHintProps) {
    if (!currentUser) return null;

    const myNative = currentUser.nativeLanguages || [];
    const myLearning = currentUser.learningLanguages || [];
    const theirNative = profileUser.nativeLanguages || [];
    const theirLearning = profileUser.learningLanguages || [];

    // Find languages you can help them with (your native = their learning)
    const canHelpWith = myNative.filter(lang =>
        theirLearning.map(l => l.toLowerCase()).includes(lang.toLowerCase())
    );

    // Find languages they can help you with (their native = your learning)
    const canLearnFrom = theirNative.filter(lang =>
        myLearning.map(l => l.toLowerCase()).includes(lang.toLowerCase())
    );

    if (canHelpWith.length === 0 && canLearnFrom.length === 0) return null;

    const displayName = profileUser.displayName || profileUser.username;

    return (
        <Card className="border-0 bg-linear-to-br from-green-500/10 via-background to-background">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">
                            Language Exchange Match! 🎉
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            {canHelpWith.length > 0 && (
                                <p>
                                    You can help {displayName} learn{' '}
                                    <span className="text-foreground font-medium">
                                        {canHelpWith.join(', ')}
                                    </span>
                                </p>
                            )}
                            {canLearnFrom.length > 0 && (
                                <p>
                                    {displayName} can help you learn{' '}
                                    <span className="text-foreground font-medium">
                                        {canLearnFrom.join(', ')}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ==================== Skeleton ====================

function PublicProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-20" />

            <Card className="overflow-hidden border-0">
                <div className="h-24 sm:h-32 bg-muted animate-pulse" />
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 -mt-12 sm:-mt-16">
                        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
                        <div className="flex-1 space-y-3 pt-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-16 w-full max-w-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-0">
                        <CardContent className="p-4 flex flex-col items-center">
                            <Skeleton className="h-10 w-10 rounded-xl mb-2" />
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-4 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ==================== Helpers ====================

function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
