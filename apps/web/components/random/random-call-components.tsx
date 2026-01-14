/**
 * Random Call UI Components
 * 
 * Modern, glassy, mobile-first components for the random voice call feature.
 */

'use client';

import React, { memo, useCallback, useMemo, useState, useRef, useEffect, type FormEvent } from 'react';
import { cn } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    PhoneCall,
    PhoneOff,
    Mic,
    MicOff,
    SkipForward,
    Globe,
    Users,
    Clock,
    Loader2,
    Settings,
    Flag,
    X,
    Check,
    ChevronDown,
    Volume2,
    VolumeX,
    Wifi,
    WifiOff,
    Signal,
    MessageSquare,
    Send,
} from 'lucide-react';
import type { ConnectionQuality, ChatMessage } from '@/lib/hooks/use-random-call';
import type { RandomCallStats, RandomCallPreferences } from '@free2talk/shared';
import type { RandomCallPartner, RandomCallState } from '@/lib/hooks/use-random-call';

// ==================== Constants ====================

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
] as const;

// ==================== Glass Styles ====================

const glassStyles = {
    card: 'backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl',
    cardDark: 'backdrop-blur-xl bg-black/20 border-white/10 shadow-2xl',
    button: 'backdrop-blur-sm bg-white/10 hover:bg-white/20 border-white/20',
    badge: 'backdrop-blur-sm bg-white/10 border-white/20',
};

// ==================== Stats Display ====================

interface StatsDisplayProps {
    stats: RandomCallStats | null;
    className?: string;
}

export const StatsDisplay = memo(function StatsDisplay({ stats, className }: StatsDisplayProps) {
    const formattedStats = useMemo(() => {
        if (!stats) return null;
        return {
            online: stats.inQueue + stats.activeCalls * 2,
            inQueue: stats.inQueue,
            activeCalls: stats.activeCalls,
        };
    }, [stats]);

    return (
        <div className={cn('flex items-center gap-4 flex-wrap justify-center', className)}>
            <StatBadge
                icon={<Users className="h-3.5 w-3.5" />}
                label="Online"
                value={formattedStats?.online ?? '-'}
                pulse
            />
            <StatBadge
                icon={<Clock className="h-3.5 w-3.5" />}
                label="In Queue"
                value={formattedStats?.inQueue ?? '-'}
            />
            <StatBadge
                icon={<PhoneCall className="h-3.5 w-3.5" />}
                label="Active Calls"
                value={formattedStats?.activeCalls ?? '-'}
            />
        </div>
    );
});

interface StatBadgeProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    pulse?: boolean;
}

const StatBadge = memo(function StatBadge({ icon, label, value, pulse }: StatBadgeProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                glassStyles.badge,
                'border text-sm'
            )}
        >
            <span className="text-primary-400">{icon}</span>
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-semibold text-foreground flex items-center gap-1">
                {value}
                {pulse && typeof value === 'number' && value > 0 && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                )}
            </span>
        </div>
    );
});

// ==================== Language Selector ====================

interface LanguageSelectorProps {
    selectedLanguages: string[];
    onToggle: (code: string) => void;
    preferenceEnabled: boolean;
    onPreferenceToggle: () => void;
    className?: string;
}

export const LanguageSelector = memo(function LanguageSelector({
    selectedLanguages,
    onToggle,
    preferenceEnabled,
    onPreferenceToggle,
    className,
}: LanguageSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const selectedCount = selectedLanguages.length;

    return (
        <Card className={cn(glassStyles.card, 'overflow-hidden', className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary-400" />
                        <CardTitle className="text-base font-medium">Language Preference</CardTitle>
                    </div>
                    <button
                        type="button"
                        onClick={onPreferenceToggle}
                        className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            preferenceEnabled ? 'bg-primary-500' : 'bg-muted'
                        )}
                        aria-label="Toggle language preference"
                    >
                        <span
                            className={cn(
                                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                preferenceEnabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                        />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {preferenceEnabled
                        ? `Matching with ${selectedCount || 'any'} language${selectedCount !== 1 ? 's' : ''}`
                        : 'Match with anyone (random)'}
                </p>
            </CardHeader>

            {preferenceEnabled && (
                <CardContent className="pt-2">
                    <button
                        type="button"
                        onClick={toggleExpand}
                        className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                            glassStyles.button,
                            'border transition-colors'
                        )}
                    >
                        <span className="text-sm">
                            {selectedCount > 0
                                ? `${selectedCount} selected`
                                : 'Select languages'}
                        </span>
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 transition-transform',
                                isExpanded && 'rotate-180'
                            )}
                        />
                    </button>

                    {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <LanguageChip
                                    key={lang.code}
                                    language={lang}
                                    selected={selectedLanguages.includes(lang.code)}
                                    onToggle={onToggle}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
});

interface LanguageChipProps {
    language: typeof SUPPORTED_LANGUAGES[number];
    selected: boolean;
    onToggle: (code: string) => void;
}

const LanguageChip = memo(function LanguageChip({ language, selected, onToggle }: LanguageChipProps) {
    const handleClick = useCallback(() => {
        onToggle(language.code);
    }, [language.code, onToggle]);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                'border active:scale-95',
                selected
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
            )}
        >
            <span>{language.flag}</span>
            <span className="truncate">{language.name}</span>
            {selected && <Check className="h-3 w-3 ml-auto" />}
        </button>
    );
});

// ==================== Idle State ====================

interface IdleStateProps {
    stats: RandomCallStats | null;
    preferences: RandomCallPreferences;
    onStartQueue: () => void;
    onPreferenceChange: (prefs: Partial<RandomCallPreferences>) => void;
    error: string | null;
    className?: string;
}

export const IdleState = memo(function IdleState({
    stats,
    preferences,
    onStartQueue,
    onPreferenceChange,
    error,
    className,
}: IdleStateProps) {
    const handleLanguageToggle = useCallback((code: string) => {
        const current = preferences.languages ?? [];
        const updated = current.includes(code)
            ? current.filter((c: string) => c !== code)
            : [...current, code];
        onPreferenceChange({ languages: updated });
    }, [preferences.languages, onPreferenceChange]);

    const handlePreferenceToggle = useCallback(() => {
        onPreferenceChange({ preferenceEnabled: !preferences.preferenceEnabled });
    }, [preferences.preferenceEnabled, onPreferenceChange]);

    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            {/* Hero Section */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/10 border border-primary-500/30 mb-2">
                    <PhoneCall className="h-10 w-10 text-primary-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Random Voice Call
                </h1>
                <p className="text-muted-foreground max-w-sm text-sm sm:text-base">
                    Connect instantly with random people around the world
                </p>
            </div>

            {/* Stats */}
            <StatsDisplay stats={stats} />

            {/* Error */}
            {error && (
                <div className="w-full max-w-md px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
                    {error}
                </div>
            )}

            {/* Language Selector */}
            <LanguageSelector
                selectedLanguages={preferences.languages ?? []}
                onToggle={handleLanguageToggle}
                preferenceEnabled={preferences.preferenceEnabled}
                onPreferenceToggle={handlePreferenceToggle}
                className="w-full max-w-md"
            />

            {/* Start Button */}
            <Button
                onClick={onStartQueue}
                size="lg"
                className={cn(
                    'w-full max-w-md h-14 text-lg font-semibold',
                    'bg-gradient-to-r from-primary-500 to-primary-600',
                    'hover:from-primary-400 hover:to-primary-500',
                    'shadow-lg shadow-primary-500/25',
                    'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]'
                )}
            >
                <PhoneCall className="h-5 w-5 mr-2" />
                Start Random Call
            </Button>
        </div>
    );
});

// ==================== Searching State ====================

interface SearchingStateProps {
    stats: RandomCallStats | null;
    onCancel: () => void;
    className?: string;
}

export const SearchingState = memo(function SearchingState({
    stats,
    onCancel,
    className,
}: SearchingStateProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            {/* Animated Searching Indicator */}
            <div className="relative">
                {/* Outer pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary-500/20 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-24 h-24 rounded-full bg-primary-500/30 animate-ping"
                        style={{ animationDelay: '150ms' }}
                    />
                </div>

                {/* Center icon */}
                <div className={cn(
                    'relative z-10 w-24 h-24 rounded-full',
                    'flex items-center justify-center',
                    'bg-gradient-to-br from-primary-500/40 to-primary-600/20',
                    'border border-primary-500/50'
                )}>
                    <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
                </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">
                    Finding a partner{dots}
                </h2>
                <p className="text-sm text-muted-foreground">
                    This usually takes a few seconds
                </p>
            </div>

            {/* Stats */}
            <StatsDisplay stats={stats} />

            {/* Cancel Button */}
            <Button
                onClick={onCancel}
                variant="outline"
                className={cn(
                    glassStyles.button,
                    'w-full max-w-xs border'
                )}
            >
                <X className="h-4 w-4 mr-2" />
                Cancel
            </Button>
        </div>
    );
});

// ==================== Connecting State ====================

interface ConnectingStateProps {
    partner: RandomCallPartner | null;
    matchedLanguage: string | null;
    className?: string;
}

export const ConnectingState = memo(function ConnectingState({
    partner,
    matchedLanguage,
    className,
}: ConnectingStateProps) {
    const languageInfo = useMemo(() => {
        if (!matchedLanguage) return null;
        return SUPPORTED_LANGUAGES.find(l => l.code === matchedLanguage);
    }, [matchedLanguage]);

    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            {/* Partner Avatar */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-green-500/20 animate-pulse" />
                </div>
                <Avatar
                    src={partner?.avatarUrl}
                    fallback={partner?.username ?? '?'}
                    size="3xl"
                    className="relative z-10 border-2 border-green-500/50"
                />
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-green-400">
                    Match Found!
                </h2>
                <p className="text-lg">
                    {partner?.displayName ?? partner?.username ?? 'Anonymous'}
                </p>
                {languageInfo && (
                    <Badge variant="secondary" className={cn(glassStyles.badge, 'border')}>
                        {languageInfo.flag} {languageInfo.name}
                    </Badge>
                )}
            </div>

            {/* Connecting indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Establishing connection...
            </div>
        </div>
    );
});

// ==================== Connected State ====================

interface ConnectedStateProps {
    partner: RandomCallPartner | null;
    matchedLanguage: string | null;
    isAudioEnabled: boolean;
    remoteStream: MediaStream | null;
    onToggleAudio: () => void;
    onNextPartner: () => void;
    onEndCall: () => void;
    onReport: () => void;
    // New props
    connectionQuality?: ConnectionQuality | null;
    isSpeaking?: boolean;
    isPartnerSpeaking?: boolean;
    messages?: ChatMessage[];
    onSendMessage?: (message: string) => void;
    callDuration?: number;
    className?: string;
}

export const ConnectedState = memo(function ConnectedState({
    partner,
    matchedLanguage,
    isAudioEnabled,
    remoteStream,
    onToggleAudio,
    onNextPartner,
    onEndCall,
    onReport,
    // New props
    connectionQuality,
    isSpeaking = false,
    isPartnerSpeaking = false,
    messages = [],
    onSendMessage,
    callDuration: externalDuration,
    className,
}: ConnectedStateProps) {
    const [internalDuration, setInternalDuration] = useState(0);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastStreamIdRef = useRef<string | null>(null);

    // Use external duration if provided, otherwise internal
    const callDuration = externalDuration ?? internalDuration;

    // Call duration timer (only if no external duration)
    useEffect(() => {
        if (externalDuration !== undefined) return;

        const interval = setInterval(() => {
            setInternalDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [externalDuration]);

    // Connect remote stream to audio element
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl || !remoteStream) return;

        const newId = remoteStream.id;
        const alreadySet = lastStreamIdRef.current === newId && audioEl.srcObject === remoteStream;
        const alreadyPlaying = !audioEl.paused && audioEl.readyState >= 2; // HAVE_CURRENT_DATA

        if (alreadySet && alreadyPlaying) {
            return; // Avoid reassigning the same stream causing AbortError
        }

        console.log('[ConnectedState] Setting remote stream to audio element');
        console.log('[ConnectedState] Remote stream tracks:', remoteStream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
        })));

        audioEl.srcObject = remoteStream;
        lastStreamIdRef.current = newId;

        const tryPlay = () => {
            audioEl.play().catch(err => {
                console.warn('[ConnectedState] play() failed, retrying with muted first:', err);
                audioEl.muted = true;
                audioEl.play().then(() => {
                    audioEl.muted = false;
                    console.log('[ConnectedState] Audio playing after unmuting');
                }).catch(err2 => {
                    console.error('[ConnectedState] Still failed to play audio:', err2);
                });
            });
        };

        // If metadata is ready, play immediately, else wait for canplay
        if (audioEl.readyState >= 2) {
            tryPlay();
        } else {
            const onCanPlay = () => {
                tryPlay();
            };
            audioEl.addEventListener('canplay', onCanPlay, { once: true });
            return () => {
                audioEl.removeEventListener('canplay', onCanPlay);
            };
        }
    }, [remoteStream]);

    const formattedDuration = useMemo(() => {
        const mins = Math.floor(callDuration / 60);
        const secs = callDuration % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [callDuration]);

    const languageInfo = useMemo(() => {
        if (!matchedLanguage) return null;
        return SUPPORTED_LANGUAGES.find(l => l.code === matchedLanguage);
    }, [matchedLanguage]);

    const handleToggleChat = useCallback(() => {
        setIsChatExpanded(prev => !prev);
    }, []);

    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            {/* Hidden audio element for remote stream */}
            <audio ref={audioRef} autoPlay playsInline />

            {/* Partner info */}
            <Card className={cn(glassStyles.card, 'w-full max-w-md border')}>
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                    {/* Top row: Connection quality + Voice activity */}
                    <div className="w-full flex items-center justify-between px-2">
                        <ConnectionQualityIndicator quality={connectionQuality ?? null} />
                        <div className="flex items-center gap-2">
                            <VoiceActivityIndicator isSpeaking={isPartnerSpeaking} label="Partner" />
                        </div>
                    </div>

                    {/* Avatar with audio visualizer and speaking indicator */}
                    <div className="relative">
                        <AudioVisualizer stream={remoteStream} />
                        <Avatar
                            src={partner?.avatarUrl}
                            fallback={partner?.username ?? '?'}
                            size="3xl"
                            className={cn(
                                'relative z-10 border-2 transition-all',
                                isPartnerSpeaking ? 'border-green-500 shadow-lg shadow-green-500/30' : 'border-green-500/50'
                            )}
                        />
                        {/* Speaking ring animation */}
                        {isPartnerSpeaking && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                <div className="w-28 h-28 rounded-full border-2 border-green-500/50 animate-ping" />
                            </div>
                        )}
                    </div>

                    {/* Name and language badge */}
                    <div className="text-center">
                        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                            {partner?.displayName ?? partner?.username ?? 'Anonymous'}
                            {languageInfo && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    {languageInfo.flag} {languageInfo.code.toUpperCase()}
                                </Badge>
                            )}
                        </h2>
                        {languageInfo && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Speaking {languageInfo.name}
                            </p>
                        )}
                    </div>

                    {/* Call duration + Your mic status */}
                    <div className="flex items-center gap-3">
                        <CallDurationDisplay duration={callDuration} />
                        <VoiceActivityIndicator isSpeaking={isSpeaking} label="You" />
                    </div>
                </CardContent>
            </Card>

            {/* Text Chat */}
            {onSendMessage && (
                <TextChat
                    messages={messages}
                    onSendMessage={onSendMessage}
                    isExpanded={isChatExpanded}
                    onToggle={handleToggleChat}
                    className="w-full max-w-md"
                />
            )}

            {/* Control buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <Button
                    onClick={onToggleAudio}
                    variant={isAudioEnabled ? 'outline' : 'danger'}
                    className={cn(
                        'h-14 flex-col gap-1',
                        isAudioEnabled && glassStyles.button,
                        isAudioEnabled && 'border'
                    )}
                >
                    {isAudioEnabled ? (
                        <>
                            <Mic className="h-5 w-5" />
                            <span className="text-xs">Mute</span>
                        </>
                    ) : (
                        <>
                            <MicOff className="h-5 w-5" />
                            <span className="text-xs">Unmute</span>
                        </>
                    )}
                </Button>

                <Button
                    onClick={onNextPartner}
                    variant="outline"
                    className={cn(glassStyles.button, 'h-14 flex-col gap-1 border')}
                >
                    <SkipForward className="h-5 w-5" />
                    <span className="text-xs">Next</span>
                </Button>

                <Button
                    onClick={onReport}
                    variant="outline"
                    className={cn(glassStyles.button, 'h-14 flex-col gap-1 border text-yellow-500 hover:text-yellow-400')}
                >
                    <Flag className="h-5 w-5" />
                    <span className="text-xs">Report</span>
                </Button>

                <Button
                    onClick={onEndCall}
                    variant="danger"
                    className="h-14 flex-col gap-1"
                >
                    <PhoneOff className="h-5 w-5" />
                    <span className="text-xs">End</span>
                </Button>
            </div>
        </div>
    );
});

// ==================== Audio Visualizer ====================

interface AudioVisualizerProps {
    stream: MediaStream | null;
}

const AudioVisualizer = memo(function AudioVisualizer({ stream }: AudioVisualizerProps) {
    const [level, setLevel] = useState(0);
    const animationRef = useRef<number | undefined>(undefined);
    const analyserRef = useRef<AnalyserNode | undefined>(undefined);

    useEffect(() => {
        if (!stream) {
            setLevel(0);
            return;
        }

        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setLevel(Math.min(average / 128, 1));
                animationRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                audioContext.close();
            };
        } catch (err) {
            console.error('[AudioVisualizer] Error:', err);
        }
    }, [stream]);

    const scale = 1 + level * 0.3;

    return (
        <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `scale(${scale})`, transition: 'transform 100ms ease-out' }}
        >
            <div
                className={cn(
                    'w-28 h-28 rounded-full',
                    'bg-gradient-to-br from-green-500/30 to-primary-500/20',
                    'border border-green-500/30'
                )}
                style={{ opacity: 0.5 + level * 0.5 }}
            />
        </div>
    );
});

// ==================== Connection Quality Indicator ====================

interface ConnectionQualityIndicatorProps {
    quality: ConnectionQuality | null;
    className?: string;
}

export const ConnectionQualityIndicator = memo(function ConnectionQualityIndicator({
    quality,
    className,
}: ConnectionQualityIndicatorProps) {
    if (!quality) return null;

    const { level, rtt, packetLoss, jitter } = quality;

    const colors = {
        excellent: 'text-green-500',
        good: 'text-green-400',
        fair: 'text-yellow-500',
        poor: 'text-red-500',
    };

    const bars = {
        excellent: 4,
        good: 3,
        fair: 2,
        poor: 1,
    };

    return (
        <div className={cn('flex items-center gap-2', className)} title={`RTT: ${Math.round(rtt)}ms, Loss: ${packetLoss.toFixed(1)}%, Jitter: ${jitter.toFixed(1)}ms`}>
            <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className={cn(
                            'w-1 rounded-full transition-colors',
                            bar <= bars[level] ? colors[level] : 'bg-muted/30'
                        )}
                        style={{ height: `${bar * 4}px` }}
                    />
                ))}
            </div>
            <span className={cn('text-xs', colors[level])}>
                {level === 'excellent' ? 'Excellent' : level === 'good' ? 'Good' : level === 'fair' ? 'Fair' : 'Poor'}
            </span>
        </div>
    );
});

// ==================== Voice Activity Indicator ====================

interface VoiceActivityIndicatorProps {
    isSpeaking: boolean;
    label?: string;
    className?: string;
}

export const VoiceActivityIndicator = memo(function VoiceActivityIndicator({
    isSpeaking,
    label = 'Speaking',
    className,
}: VoiceActivityIndicatorProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-full text-xs transition-all',
                isSpeaking
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-muted/20 text-muted-foreground border border-muted/20',
                className
            )}
        >
            <div
                className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50'
                )}
            />
            {label}
        </div>
    );
});

// ==================== Text Chat ====================

interface TextChatProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
    className?: string;
}

export const TextChat = memo(function TextChat({
    messages,
    onSendMessage,
    isExpanded,
    onToggle,
    className,
}: TextChatProps) {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue('');
    }, [inputValue, onSendMessage]);

    const unreadCount = useMemo(() => {
        if (isExpanded) return 0;
        // Count recent messages from partner in last 30 seconds
        const thirtySecsAgo = Date.now() - 30000;
        return messages.filter(m => !m.isOwn && m.timestamp > thirtySecsAgo).length;
    }, [messages, isExpanded]);

    return (
        <div className={cn('w-full', className)}>
            {/* Toggle button */}
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg',
                    glassStyles.button,
                    'border transition-colors mb-2'
                )}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-medium">Text Chat</span>
                    {unreadCount > 0 && (
                        <Badge variant="error" className="h-5 min-w-5 px-1.5">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                    )}
                />
            </button>

            {/* Chat panel */}
            {isExpanded && (
                <Card className={cn(glassStyles.card, 'border')}>
                    <CardContent className="p-3">
                        {/* Messages */}
                        <div className="h-48 overflow-y-auto space-y-2 mb-3 pr-1">
                            {messages.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    No messages yet. Say hello! 👋
                                </p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'max-w-[85%] p-2 rounded-lg text-sm',
                                            msg.isOwn
                                                ? 'ml-auto bg-primary-500/30 text-foreground'
                                                : 'bg-muted/30 text-foreground'
                                        )}
                                    >
                                        {msg.message}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                maxLength={500}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-lg text-sm',
                                    'bg-muted/20 border border-muted/30',
                                    'focus:outline-none focus:border-primary-500/50',
                                    'placeholder:text-muted-foreground'
                                )}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!inputValue.trim()}
                                className="px-3"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
});

// ==================== Call Duration Display ====================

interface CallDurationDisplayProps {
    duration: number;
    className?: string;
}

export const CallDurationDisplay = memo(function CallDurationDisplay({
    duration,
    className,
}: CallDurationDisplayProps) {
    const formatted = useMemo(() => {
        const hours = Math.floor(duration / 3600);
        const mins = Math.floor((duration % 3600) / 60);
        const secs = duration % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [duration]);

    return (
        <Badge
            variant="secondary"
            className={cn(glassStyles.badge, 'border text-green-400', className)}
        >
            <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {formatted}
        </Badge>
    );
});

// ==================== Ended State ====================

interface EndedStateProps {
    onStartAgain: () => void;
    className?: string;
}

export const EndedState = memo(function EndedState({
    onStartAgain,
    className,
}: EndedStateProps) {
    return (
        <div className={cn('flex flex-col items-center gap-6', className)}>
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-2">
                    <PhoneOff className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Call Ended</h2>
                <p className="text-muted-foreground text-sm">
                    Thanks for using Random Call!
                </p>
            </div>

            <Button
                onClick={onStartAgain}
                size="lg"
                className={cn(
                    'w-full max-w-xs h-12',
                    'bg-gradient-to-r from-primary-500 to-primary-600',
                    'hover:from-primary-400 hover:to-primary-500'
                )}
            >
                <PhoneCall className="h-5 w-5 mr-2" />
                Start New Call
            </Button>
        </div>
    );
});

// ==================== Report Dialog ====================

interface ReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details?: string) => void;
}

export const ReportDialog = memo(function ReportDialog({
    isOpen,
    onClose,
    onSubmit,
}: ReportDialogProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');

    const handleSubmit = useCallback(() => {
        if (selectedReason) {
            onSubmit(selectedReason, details || undefined);
            onClose();
            setSelectedReason(null);
            setDetails('');
        }
    }, [selectedReason, details, onSubmit, onClose]);

    if (!isOpen) return null;

    const reasons = [
        { id: 'harassment', label: 'Harassment or bullying' },
        { id: 'inappropriate', label: 'Inappropriate content' },
        { id: 'spam', label: 'Spam or advertising' },
        { id: 'offensive', label: 'Offensive language' },
        { id: 'other', label: 'Other' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <Card className={cn(glassStyles.card, 'relative z-10 w-full max-w-sm border')}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-yellow-500" />
                            Report User
                        </CardTitle>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {reasons.map(reason => (
                            <button
                                key={reason.id}
                                type="button"
                                onClick={() => setSelectedReason(reason.id)}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg text-sm text-left transition-all',
                                    'border active:scale-[0.98]',
                                    selectedReason === reason.id
                                        ? 'bg-primary-500/20 border-primary-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                )}
                            >
                                {reason.label}
                            </button>
                        ))}
                    </div>

                    {selectedReason === 'other' && (
                        <textarea
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder="Please describe the issue..."
                            className={cn(
                                'w-full px-3 py-2 rounded-lg text-sm resize-none',
                                'bg-white/5 border border-white/10',
                                'focus:outline-none focus:border-primary-500/50',
                                'placeholder:text-muted-foreground'
                            )}
                            rows={3}
                        />
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className={cn(glassStyles.button, 'flex-1 border')}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedReason}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-500"
                        >
                            Submit Report
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
