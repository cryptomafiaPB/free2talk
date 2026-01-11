'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/design-system';
import { Button } from './button';
import { Avatar } from './avatar';
import { SearchInput } from './input';
import {
    Home,
    Users,
    MessageCircle,
    User,
    Settings,
    LogOut,
    Bell,
    Plus,
    Menu,
    X,
} from './icons';
import { useState } from 'react';

interface SidebarProps {
    user?: {
        id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    } | null;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

const mainNavItems: NavItem[] = [
    { href: '/', label: 'Voice Rooms', icon: <Home className="h-5 w-5" /> },
    { href: '/random', label: 'Random Match', icon: <Users className="h-5 w-5" /> },
    { href: '/messages', label: 'Messages', icon: <MessageCircle className="h-5 w-5" /> },
];

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40',
                'bg-background-secondary border-r border-surface-border',
                'transition-all duration-300 ease-out',
                isCollapsed ? 'w-[72px]' : 'w-64'
            )}
        >
            {/* Logo & Toggle */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border">
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">F2T</span>
                        </div>
                        <span className="font-semibold text-text-primary">Free2Talk</span>
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
                >
                    {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>
            </div>

            {/* Search - Hidden when collapsed */}
            {!isCollapsed && (
                <div className="p-4">
                    <SearchInput placeholder="Search rooms..." />
                </div>
            )}

            {/* Create Room Button */}
            <div className="px-4 py-2">
                <Button
                    size={isCollapsed ? 'icon' : 'md'}
                    className={cn(!isCollapsed && 'w-full', isCollapsed && 'w-10 h-10 mx-auto')}
                    asChild
                >
                    <Link href="/rooms/create">
                        <Plus className="h-5 w-5" />
                        {!isCollapsed && <span>Create Room</span>}
                    </Link>
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                                isCollapsed && 'justify-center px-2'
                            )}
                        >
                            {item.icon}
                            {!isCollapsed && (
                                <span className="font-medium">{item.label}</span>
                            )}
                            {!isCollapsed && item.badge && (
                                <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-surface-border">
                {user ? (
                    <div className={cn(
                        'flex items-center gap-3',
                        isCollapsed && 'justify-center'
                    )}>
                        <Link href="/profile">
                            <Avatar
                                src={user.avatarUrl}
                                alt={user.displayName || user.username}
                                fallback={user.displayName || user.username}
                                size="sm"
                                status="online"
                                showStatus
                            />
                        </Link>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">
                                    {user.displayName || user.username}
                                </p>
                                <p className="text-xs text-text-tertiary truncate">
                                    @{user.username}
                                </p>
                            </div>
                        )}
                        {!isCollapsed && (
                            <button className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary transition-colors">
                                <Settings className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <Button variant="secondary" size={isCollapsed ? 'icon' : 'md'} className={!isCollapsed ? 'w-full' : ''} asChild>
                        <Link href="/login">
                            {isCollapsed ? <User className="h-5 w-5" /> : 'Sign In'}
                        </Link>
                    </Button>
                )}
            </div>
        </aside>
    );
}
