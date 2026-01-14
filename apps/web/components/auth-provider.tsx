'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthInitializer, useAuthSync } from '@/lib/hooks';

/**
 * AuthProvider - Initializes auth state and syncs with API client
 * Must be placed inside QueryClientProvider but wraps all auth-dependent content
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialize auth from persisted storage and set up event listeners
    useAuthInitializer();

    // Keep API client in sync with auth store
    useAuthSync();

    return <>{children}</>;
}
