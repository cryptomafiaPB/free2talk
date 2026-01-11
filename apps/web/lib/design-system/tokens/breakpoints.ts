/**
 * Breakpoints System - Free2Talk Design Tokens
 * 
 * Mobile-first breakpoint system
 */

export const breakpoints = {
    xs: '375px',   // Small phones
    sm: '640px',   // Large phones
    md: '768px',   // Tablets
    lg: '1024px',  // Small laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px', // Large screens
} as const;

// Media query helpers
export const mediaQueries = {
    xs: `(min-width: ${breakpoints.xs})`,
    sm: `(min-width: ${breakpoints.sm})`,
    md: `(min-width: ${breakpoints.md})`,
    lg: `(min-width: ${breakpoints.lg})`,
    xl: `(min-width: ${breakpoints.xl})`,
    '2xl': `(min-width: ${breakpoints['2xl']})`,

    // Max width queries (mobile-first exceptions)
    maxXs: `(max-width: ${breakpoints.xs})`,
    maxSm: `(max-width: ${breakpoints.sm})`,
    maxMd: `(max-width: ${breakpoints.md})`,
    maxLg: `(max-width: ${breakpoints.lg})`,

    // Orientation
    portrait: '(orientation: portrait)',
    landscape: '(orientation: landscape)',

    // Interaction
    touch: '(hover: none) and (pointer: coarse)',
    mouse: '(hover: hover) and (pointer: fine)',

    // Preference
    reducedMotion: '(prefers-reduced-motion: reduce)',
    darkMode: '(prefers-color-scheme: dark)',
} as const;

// Layout constants based on breakpoints
export const layout = {
    // Container max widths
    containerMaxWidth: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1400px',
    },

    // Grid columns
    columns: {
        mobile: 4,
        tablet: 8,
        desktop: 12,
    },

    // Safe areas (for mobile devices with notches)
    safeArea: {
        top: 'env(safe-area-inset-top)',
        right: 'env(safe-area-inset-right)',
        bottom: 'env(safe-area-inset-bottom)',
        left: 'env(safe-area-inset-left)',
    },
} as const;

export type Breakpoint = keyof typeof breakpoints;
