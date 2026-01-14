'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated, selectIsInitialized } from '../../lib/stores';

interface ProtectedRouteProps {
    children: ReactNode;
    redirectTo?: string;
    fallback?: ReactNode;
}

/**
 * Protected route wrapper - redirects to login if not authenticated
 * Uses client-side rendering with fallback to prevent flash of content
 */
export function ProtectedRoute({ children, redirectTo = '/login', fallback }: ProtectedRouteProps) {
    const router = useRouter();
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isInitialized = useAuthStore(selectIsInitialized);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isInitialized, router, redirectTo]);

    // Show fallback while checking auth
    if (!isInitialized) {
        return fallback ?? <AuthLoadingFallback />;
    }

    // Not authenticated - don't render children
    if (!isAuthenticated) {
        return fallback ?? <AuthLoadingFallback />;
    }

    return <>{children}</>;
}

interface GuestRouteProps {
    children: ReactNode;
    redirectTo?: string;
    fallback?: ReactNode;
}

/**
 * Guest route wrapper - redirects to home if already authenticated
 * Used for login/register pages
 */
export function GuestRoute({ children, redirectTo = '/', fallback }: GuestRouteProps) {
    const router = useRouter();
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const isInitialized = useAuthStore(selectIsInitialized);

    useEffect(() => {
        if (isInitialized && isAuthenticated) {
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isInitialized, router, redirectTo]);

    // Show fallback while checking auth
    if (!isInitialized) {
        return fallback ?? <AuthLoadingFallback />;
    }

    // Already authenticated - don't render children
    if (isAuthenticated) {
        return fallback ?? <AuthLoadingFallback />;
    }

    return <>{children}</>;
}

/**
 * Default loading fallback for auth checks
 */
function AuthLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    );
}

export { AuthLoadingFallback };
