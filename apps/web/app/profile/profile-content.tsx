'use client';

import { useState } from 'react';
import {
    Card,
    Avatar,
    Button,
    LanguageBadge,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Separator,
} from '@/components/ui';
import {
    Settings,
    Edit,
    Users,
    Clock,
    Globe,
    Calendar,
    ChevronRight,
} from '@/components/ui/icons';
import Link from 'next/link';
import { cn } from '@/lib/design-system';

// Mock profile data
const mockProfile = {
    id: 'current-user',
    username: 'alex_m',
    displayName: 'Alex Martinez',
    avatarUrl: undefined,
    bio: 'Language enthusiast learning Japanese and Korean. Love discussing tech and travel!',
    nativeLanguages: ['English', 'Spanish'],
    learningLanguages: ['Japanese', 'Korean'],
    isOnline: true,
    createdAt: new Date('2024-06-15'),
    stats: {
        totalMinutes: 1250,
        roomsJoined: 48,
        roomsCreated: 12,
        followers: 156,
        following: 89,
    },
};

export function ProfileContent() {
    const profile = mockProfile;

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card variant="gradient" padding="lg">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex justify-center sm:justify-start">
                        <Avatar
                            src={profile.avatarUrl}
                            alt={profile.displayName || profile.username}
                            fallback={profile.displayName || profile.username}
                            size="3xl"
                            status="online"
                            showStatus
                            statusPosition="bottom-right"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-2xl font-bold text-text-primary">
                                {profile.displayName}
                            </h1>
                            <span className="text-text-tertiary">@{profile.username}</span>
                        </div>

                        {profile.bio && (
                            <p className="mt-2 text-text-secondary max-w-md">
                                {profile.bio}
                            </p>
                        )}

                        {/* Languages */}
                        <div className="mt-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                                <span className="text-xs text-text-tertiary uppercase tracking-wide">Native:</span>
                                {profile.nativeLanguages.map((lang) => (
                                    <LanguageBadge key={lang} language={lang} size="sm" />
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                                <span className="text-xs text-text-tertiary uppercase tracking-wide">Learning:</span>
                                {profile.learningLanguages.map((lang) => (
                                    <LanguageBadge key={lang} language={lang} size="sm" />
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2 justify-center sm:justify-start">
                            <Button variant="secondary" size="sm" asChild>
                                <Link href="/settings">
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/settings">
                                    <Settings className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatItem
                        value={formatMinutes(profile.stats.totalMinutes)}
                        label="Practice time"
                        icon={<Clock className="h-4 w-4" />}
                    />
                    <StatItem
                        value={profile.stats.roomsJoined}
                        label="Rooms joined"
                        icon={<Users className="h-4 w-4" />}
                    />
                    <StatItem
                        value={profile.stats.followers}
                        label="Followers"
                    />
                    <StatItem
                        value={profile.stats.following}
                        label="Following"
                    />
                </div>
            </Card>

            {/* Activity Tabs */}
            <Tabs defaultValue="activity">
                <TabsList>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="rooms">My Rooms</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                </TabsList>

                <TabsContent value="activity">
                    <ActivitySection />
                </TabsContent>

                <TabsContent value="rooms">
                    <MyRoomsSection />
                </TabsContent>

                <TabsContent value="friends">
                    <FriendsSection />
                </TabsContent>
            </Tabs>

            {/* Quick Links */}
            <Card padding="none">
                <QuickLinkItem
                    href="/settings"
                    label="Settings"
                    icon={<Settings className="h-5 w-5" />}
                />
                <Separator />
                <QuickLinkItem
                    href="/settings/languages"
                    label="Language Preferences"
                    icon={<Globe className="h-5 w-5" />}
                />
                <Separator />
                <QuickLinkItem
                    href="/settings/notifications"
                    label="Notifications"
                    icon={<Users className="h-5 w-5" />}
                />
            </Card>
        </div>
    );
}

// Stat Item Component
function StatItem({
    value,
    label,
    icon
}: {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="text-center p-3 rounded-xl bg-background-primary/50">
            <div className="flex items-center justify-center gap-1.5 text-text-primary">
                {icon && <span className="text-primary-400">{icon}</span>}
                <span className="text-xl font-bold">{value}</span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">{label}</p>
        </div>
    );
}

// Quick Link Item
function QuickLinkItem({
    href,
    label,
    icon
}: {
    href: string;
    label: string;
    icon: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
        >
            <div className="flex items-center gap-3">
                <span className="text-text-secondary">{icon}</span>
                <span className="text-text-primary">{label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-text-tertiary" />
        </Link>
    );
}

// Activity Section
function ActivitySection() {
    const activities = [
        { type: 'room_joined', room: 'English Practice', time: '2 hours ago' },
        { type: 'room_created', room: 'Tech Talk', time: '1 day ago' },
        { type: 'room_joined', room: 'Japanese Learners', time: '2 days ago' },
    ];

    return (
        <Card padding="none">
            {activities.length > 0 ? (
                <div className="divide-y divide-surface-border">
                    {activities.map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 p-4">
                            <div className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center',
                                activity.type === 'room_created'
                                    ? 'bg-status-success/10 text-status-success'
                                    : 'bg-primary-500/10 text-primary-400'
                            )}>
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-text-primary">
                                    {activity.type === 'room_created' ? 'Created' : 'Joined'}{' '}
                                    <span className="font-medium">{activity.room}</span>
                                </p>
                                <p className="text-xs text-text-tertiary">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center text-text-secondary">
                    No recent activity
                </div>
            )}
        </Card>
    );
}

// My Rooms Section
function MyRoomsSection() {
    return (
        <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-text-tertiary mb-3" />
            <p className="text-text-secondary">You haven&apos;t created any rooms yet</p>
            <Button className="mt-4" asChild>
                <Link href="/rooms/create">Create your first room</Link>
            </Button>
        </Card>
    );
}

// Friends Section
function FriendsSection() {
    const friends = [
        { id: '1', username: 'sarah_m', displayName: 'Sarah', isOnline: true },
        { id: '2', username: 'yuki_t', displayName: 'Yuki', isOnline: true },
        { id: '3', username: 'pierre', displayName: 'Pierre', isOnline: false },
    ];

    return (
        <Card padding="none">
            <div className="divide-y divide-surface-border">
                {friends.map((friend) => (
                    <Link
                        key={friend.id}
                        href={`/users/${friend.username}`}
                        className="flex items-center gap-3 p-4 hover:bg-surface-hover transition-colors"
                    >
                        <Avatar
                            fallback={friend.displayName}
                            size="md"
                            status={friend.isOnline ? 'online' : 'offline'}
                            showStatus
                        />
                        <div className="flex-1">
                            <p className="font-medium text-text-primary">{friend.displayName}</p>
                            <p className="text-xs text-text-tertiary">@{friend.username}</p>
                        </div>
                        <span className={cn(
                            'text-xs',
                            friend.isOnline ? 'text-status-success' : 'text-text-tertiary'
                        )}>
                            {friend.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </Link>
                ))}
            </div>
        </Card>
    );
}

// Helper function to format minutes
function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}
