'use client';

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useRandomCall } from '@/lib/hooks/use-random-call';
import {
    IdleState,
    SearchingState,
    ConnectingState,
    ConnectedState,
    EndedState,
    ReportDialog,
} from '@/components/random';
import { cn } from '@/lib/design-system';
import type { RandomCallPreferences } from '@free2talk/shared';

/**
 * RandomMatchContent - Main component for random voice call feature
 * 
 * Modern, glassy, mobile-first UI with optimized rendering.
 * Uses P2P WebRTC for direct peer-to-peer audio communication.
 */
export const RandomMatchContent = memo(function RandomMatchContent() {
    // Preferences state (persisted locally)
    // Initialize with default values to avoid hydration mismatch
    const [preferences, setPreferences] = useState<RandomCallPreferences>({
        preferenceEnabled: false,
        languages: [],
    });

    // Restore preferences from localStorage after hydration
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        try {
            const saved = localStorage.getItem('random-call-preferences');
            if (saved) {
                setPreferences(JSON.parse(saved));
            }
        } catch {
            // Ignore parse errors
        }
        setIsHydrated(true);
    }, []);

    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    // Use the random call hook
    const {
        state,
        stats,
        partner,
        matchedLanguage,
        isAudioEnabled,
        error,
        remoteStream,
        startQueue,
        cancelQueue,
        nextPartner,
        endCall,
        toggleAudio,
        reportUser,
        // New features
        connectionQuality,
        isSpeaking,
        isPartnerSpeaking,
        messages,
        sendMessage,
        callDuration,
    } = useRandomCall();

    // Persist preferences to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('random-call-preferences', JSON.stringify(preferences));
        }
    }, [preferences]);

    // Handlers with useCallback for optimal rendering
    const handlePreferenceChange = useCallback((updates: Partial<RandomCallPreferences>) => {
        setPreferences(prev => ({ ...prev, ...updates }));
    }, []);

    const handleStartQueue = useCallback(() => {
        startQueue(preferences);
    }, [startQueue, preferences]);

    const handleCancelQueue = useCallback(() => {
        cancelQueue();
    }, [cancelQueue]);

    const handleNextPartner = useCallback(() => {
        nextPartner();
    }, [nextPartner]);

    const handleEndCall = useCallback(() => {
        endCall();
    }, [endCall]);

    const handleToggleAudio = useCallback(() => {
        toggleAudio();
    }, [toggleAudio]);

    const handleOpenReport = useCallback(() => {
        setIsReportDialogOpen(true);
    }, []);

    const handleCloseReport = useCallback(() => {
        setIsReportDialogOpen(false);
    }, []);

    const handleSubmitReport = useCallback((reason: string, details?: string) => {
        reportUser(reason, details);
    }, [reportUser]);

    const handleStartAgain = useCallback(() => {
        startQueue(preferences);
    }, [startQueue, preferences]);

    // Render the appropriate state
    const content = useMemo(() => {
        switch (state) {
            case 'idle':
                return (
                    <IdleState
                        stats={stats}
                        preferences={preferences}
                        onStartQueue={handleStartQueue}
                        onPreferenceChange={handlePreferenceChange}
                        error={error}
                    />
                );

            case 'queued':
                return (
                    <SearchingState
                        stats={stats}
                        onCancel={handleCancelQueue}
                    />
                );

            case 'connecting':
                return (
                    <ConnectingState
                        partner={partner}
                        matchedLanguage={matchedLanguage}
                    />
                );

            case 'connected':
                return (
                    <ConnectedState
                        partner={partner}
                        matchedLanguage={matchedLanguage}
                        isAudioEnabled={isAudioEnabled}
                        remoteStream={remoteStream}
                        onToggleAudio={handleToggleAudio}
                        onNextPartner={handleNextPartner}
                        onEndCall={handleEndCall}
                        onReport={handleOpenReport}
                        // New features
                        connectionQuality={connectionQuality}
                        isSpeaking={isSpeaking}
                        isPartnerSpeaking={isPartnerSpeaking}
                        messages={messages}
                        onSendMessage={sendMessage}
                        callDuration={callDuration}
                    />
                );

            case 'ended':
                return (
                    <EndedState onStartAgain={handleStartAgain} />
                );

            default:
                return null;
        }
    }, [
        state,
        stats,
        preferences,
        handleStartQueue,
        handlePreferenceChange,
        error,
        handleCancelQueue,
        partner,
        matchedLanguage,
        isAudioEnabled,
        remoteStream,
        handleToggleAudio,
        handleNextPartner,
        handleEndCall,
        handleOpenReport,
        handleStartAgain,
        // New features
        connectionQuality,
        isSpeaking,
        isPartnerSpeaking,
        messages,
        sendMessage,
        callDuration,
    ]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            {/* Background gradient */}
            <div
                className={cn(
                    'fixed inset-0 -z-10 pointer-events-none',
                    'bg-gradient-to-br from-primary-950/50 via-background to-background'
                )}
            />

            {/* Decorative blobs */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div
                    className={cn(
                        'absolute -top-1/4 -left-1/4 w-1/2 h-1/2',
                        'bg-primary-500/10 rounded-full blur-3xl'
                    )}
                />
                <div
                    className={cn(
                        'absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2',
                        'bg-primary-600/10 rounded-full blur-3xl'
                    )}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg">
                    {content}
                </div>
            </main>

            {/* Report dialog */}
            <ReportDialog
                isOpen={isReportDialogOpen}
                onClose={handleCloseReport}
                onSubmit={handleSubmitReport}
            />
        </div>
    );
});

// Default export for compatibility
export default RandomMatchContent;
