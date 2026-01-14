'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthProviderProps {
    children: React.ReactNode;
}

/**
 * Google OAuth Provider wrapper
 * Wraps the application to provide Google OAuth context
 */
export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // If no client ID configured, render children without provider
    // This allows the app to work without Google auth in development
    if (!clientId) {
        console.warn('[GoogleAuthProvider] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will be disabled.');
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
