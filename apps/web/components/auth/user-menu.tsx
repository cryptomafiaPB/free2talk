'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/primitives';
import { useAuth } from '@/lib/hooks';
import { useAuthStore, selectIsAuthenticated, selectIsInitialized } from '@/lib/stores';

/**
 * User menu component - shows login button or user dropdown based on auth state
 * Memoized to prevent unnecessary re-renders
 */
export const UserMenu = memo(function UserMenu() {
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isInitialized = useAuthStore(selectIsInitialized);

    // Show loading state while auth is initializing
    if (!isInitialized) {
        return <UserMenuSkeleton />;
    }

    return isAuthenticated ? <AuthenticatedMenu /> : <UnauthenticatedMenu />;
});

/**
 * Skeleton loader for user menu
 */
const UserMenuSkeleton = memo(function UserMenuSkeleton() {
    return (
        <div className="flex items-center gap-2">
            <div className="h-9 w-20 rounded-lg bg-surface animate-pulse" />
        </div>
    );
});

/**
 * Menu for unauthenticated users
 */
const UnauthenticatedMenu = memo(function UnauthenticatedMenu() {
    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
                <Link href="/register">Sign Up</Link>
            </Button>
        </div>
    );
});

/**
 * Dropdown menu for authenticated users
 */
const AuthenticatedMenu = memo(function AuthenticatedMenu() {
    const { user, logout, isLoading } = useAuth();

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [logout]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Avatar
                        size="sm"
                        src={user?.avatarUrl ?? undefined}
                        alt={user?.displayName ?? user?.username ?? 'User'}
                        fallback={user?.displayName || user?.username || 'U'}
                    />
                    <span className="hidden sm:inline-block max-w-[100px] truncate">
                        {user?.displayName || user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.displayName || user?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="cursor-pointer text-danger-500 focus:text-danger-500"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoading ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

export default UserMenu;
