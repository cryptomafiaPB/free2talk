/**
 * Color System - Free2Talk Design Tokens
 * 
 * Inspired by HelloTalk's dark theme with purple accents
 * Mobile-first, accessible color palette
 */

export const colors = {
    // Primary - Purple accent (signature color)
    primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6', // Main primary
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        950: '#2e1065',
    },

    // Secondary - Indigo for depth
    secondary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
    },

    // Background colors - Dark theme
    background: {
        primary: '#0d0d14',      // Deepest background
        secondary: '#13131f',    // Card backgrounds
        tertiary: '#1a1a2e',     // Elevated elements
        elevated: '#252538',     // Hover states, inputs
        overlay: 'rgba(0, 0, 0, 0.7)', // Modal overlays
    },

    // Surface colors for cards and containers
    surface: {
        default: '#16162a',
        hover: '#1e1e38',
        active: '#262648',
        border: '#2a2a4a',
        borderSubtle: '#1f1f3a',
    },

    // Text colors
    text: {
        primary: '#f8fafc',      // Main text
        secondary: '#a1a1aa',    // Muted text
        tertiary: '#71717a',     // Disabled/placeholder
        inverse: '#0d0d14',      // Text on light bg
        accent: '#a78bfa',       // Highlighted text
    },

    // Status colors
    status: {
        success: '#22c55e',
        successMuted: '#166534',
        warning: '#f59e0b',
        warningMuted: '#92400e',
        error: '#ef4444',
        errorMuted: '#991b1b',
        info: '#3b82f6',
        infoMuted: '#1e40af',
    },

    // Voice/Audio specific
    voice: {
        speaking: '#22c55e',     // Active speaking indicator
        speakingGlow: 'rgba(34, 197, 94, 0.4)',
        muted: '#ef4444',
        mutedGlow: 'rgba(239, 68, 68, 0.3)',
        idle: '#71717a',
    },

    // Interactive states
    interactive: {
        hover: 'rgba(139, 92, 246, 0.1)',
        active: 'rgba(139, 92, 246, 0.2)',
        focus: 'rgba(139, 92, 246, 0.4)',
    },

    // Language badges - Colorful indicators
    language: {
        english: '#3b82f6',
        spanish: '#f59e0b',
        french: '#ec4899',
        german: '#10b981',
        japanese: '#ef4444',
        korean: '#8b5cf6',
        chinese: '#f97316',
        portuguese: '#06b6d4',
        russian: '#6366f1',
        arabic: '#14b8a6',
        default: '#6366f1',
    },

    // Gradients
    gradient: {
        primary: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        secondary: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
        surface: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
        glow: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        card: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
    },
} as const;

// CSS Variables mapping for Tailwind
export const cssVariables = {
    '--color-primary': colors.primary[500],
    '--color-primary-hover': colors.primary[400],
    '--color-primary-active': colors.primary[600],

    '--color-background': colors.background.primary,
    '--color-background-secondary': colors.background.secondary,
    '--color-background-tertiary': colors.background.tertiary,

    '--color-surface': colors.surface.default,
    '--color-surface-hover': colors.surface.hover,
    '--color-surface-border': colors.surface.border,

    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-tertiary': colors.text.tertiary,

    '--color-success': colors.status.success,
    '--color-warning': colors.status.warning,
    '--color-error': colors.status.error,
    '--color-info': colors.status.info,
} as const;

export type ColorToken = typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
