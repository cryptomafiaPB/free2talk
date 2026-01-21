/**
 * Room Control Bar Component
 * 
 * Top-centered control bar for voice rooms.
 */

'use client';

import { memo, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/design-system';
import {
    Mic,
    MicOff,
    MonitorOff,
    Monitor,
    Phone,
    Settings,
    Volume2,
    VolumeX,
    Loader2,
    Signal,
    SignalHigh,
    SignalMedium,
    SignalLow,
    SignalZero,
    Wifi,
    WifiOff,
} from '@/components/ui/icons';

export interface RoomControlBarProps {
    isMuted: boolean;
    isDeafened: boolean;
    isScreenSharing?: boolean;
    isLeaving: boolean;
    isDisconnected: boolean;
    connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
    onMuteToggle: () => void;
    onDeafenToggle: () => void;
    onScreenShareToggle?: () => void;
    onLeave: () => void;
    onSettings?: () => void;
}

/**
 * Get signal strength icon and color based on connection quality
 */
function getSignalConfig(quality: string) {
    switch (quality) {
        case 'excellent':
            return { bars: 4, color: 'text-green-500', label: 'Excellent' };
        case 'good':
            return { bars: 3, color: 'text-green-500', label: 'Good' };
        case 'fair':
            return { bars: 2, color: 'text-yellow-500', label: 'Fair' };
        case 'poor':
            return { bars: 1, color: 'text-red-500', label: 'Poor' };
        default:
            return { bars: 0, color: 'text-gray-500', label: 'Disconnected' };
    }
}

/**
 * Custom Signal Bars Component
 */
const SignalBars = memo(function SignalBars({
    quality
}: {
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'
}) {
    const config = getSignalConfig(quality);

    return (
        <div className="flex items-end gap-[2px] h-4" title={config.label}>
            {[1, 2, 3, 4].map((bar) => (
                <div
                    key={bar}
                    className={cn(
                        'w-[3px] rounded-sm transition-colors',
                        bar <= config.bars ? config.color.replace('text-', 'bg-') : 'bg-gray-600'
                    )}
                    style={{ height: `${bar * 25}%` }}
                />
            ))}
        </div>
    );
});

/**
 * Main control bar component
 */
export const RoomControlBar = memo(function RoomControlBar({
    isMuted,
    isDeafened,
    isScreenSharing = false,
    isLeaving,
    isDisconnected,
    connectionQuality = 'good',
    onMuteToggle,
    onDeafenToggle,
    onScreenShareToggle,
    onLeave,
    onSettings,
}: RoomControlBarProps) {
    return (
        <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Microphone Toggle */}
                <ControlButton
                    onClick={onMuteToggle}
                    disabled={isDisconnected}
                    active={isMuted}
                    activeColor="bg-blue-600 hover:bg-blue-700"
                    tooltip={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <MicOff className="h-5 w-5" />
                    ) : (
                        <Mic className="h-5 w-5" />
                    )}
                </ControlButton>

                {/* Screen Share Toggle (placeholder for future) */}
                <ControlButton
                    onClick={onScreenShareToggle}
                    disabled={isDisconnected || !onScreenShareToggle}
                    active={isScreenSharing}
                    activeColor="bg-blue-600 hover:bg-blue-700"
                    tooltip={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                >
                    {isScreenSharing ? (
                        <Monitor className="h-5 w-5" />
                    ) : (
                        <MonitorOff className="h-5 w-5" />
                    )}
                </ControlButton>

                {/* Connection Quality Indicator */}
                <div className="px-3 py-2 flex items-center justify-center">
                    <SignalBars quality={isDisconnected ? 'disconnected' : connectionQuality} />
                </div>

                {/* Leave Call Button */}
                <ControlButton
                    onClick={onLeave}
                    disabled={isLeaving}
                    variant="danger"
                    tooltip="Leave Room"
                >
                    {isLeaving ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Phone className="h-5 w-5 rotate-[135deg]" />
                    )}
                </ControlButton>
            </div>
        </div>
    );
});

interface ControlButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
    activeColor?: string;
    variant?: 'default' | 'danger';
    tooltip?: string;
}

/**
 * Individual control button
 */
const ControlButton = memo(function ControlButton({
    children,
    onClick,
    disabled = false,
    active = false,
    activeColor = 'bg-blue-600 hover:bg-blue-700',
    variant = 'default',
    tooltip,
}: ControlButtonProps) {
    const baseClasses = 'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        default: active
            ? `${activeColor} text-white`
            : 'bg-white/10 hover:bg-white/20 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, variantClasses[variant])}
            title={tooltip}
        >
            {children}
        </button>
    );
});

/**
 * Alternative floating control bar for bottom placement
 * Keeping the existing control functionality but with updated styling
 */
export const BottomControlBar = memo(function BottomControlBar({
    isMuted,
    isDeafened,
    isLeaving,
    isDisconnected,
    connectionQuality = 'good',
    onMuteToggle,
    onDeafenToggle,
    onLeave,
    onSettings,
}: Omit<RoomControlBarProps, 'isScreenSharing' | 'onScreenShareToggle'>) {
    return (
        <div className="shrink-0 safe-area-bottom">
            <div className="flex items-center justify-center gap-4 px-4 py-4">
                {/* Mute button */}
                <button
                    onClick={onMuteToggle}
                    disabled={isDisconnected}
                    className={cn(
                        'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isMuted
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                    )}
                >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>

                {/* Deafen button */}
                <button
                    onClick={onDeafenToggle}
                    disabled={isDisconnected}
                    className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isDeafened
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                    )}
                >
                    {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                {/* Leave button */}
                <button
                    onClick={onLeave}
                    disabled={isLeaving}
                    className={cn(
                        'flex items-center justify-center w-14 h-14 rounded-full transition-all duration-200',
                        'bg-red-500 hover:bg-red-600 text-white',
                        'shadow-lg shadow-red-500/25',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    {isLeaving ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Phone className="h-6 w-6 rotate-135" />
                    )}
                </button>

                {/* Settings button */}
                <button
                    onClick={onSettings}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200"
                >
                    <Settings className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
});

RoomControlBar.displayName = 'RoomControlBar';
BottomControlBar.displayName = 'BottomControlBar';
ControlButton.displayName = 'ControlButton';
SignalBars.displayName = 'SignalBars';
