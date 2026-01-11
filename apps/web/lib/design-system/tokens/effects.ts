/**
 * Effects System - Free2Talk Design Tokens
 * 
 * Shadows, glows, and visual effects
 */

export const shadows = {
    none: 'none',

    // Standard shadows
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',

    // Inner shadow
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',

    // Glow effects (for primary color)
    glowSm: '0 0 10px rgba(139, 92, 246, 0.3)',
    glow: '0 0 20px rgba(139, 92, 246, 0.4)',
    glowLg: '0 0 30px rgba(139, 92, 246, 0.5)',

    // Status glows
    glowSuccess: '0 0 20px rgba(34, 197, 94, 0.4)',
    glowError: '0 0 20px rgba(239, 68, 68, 0.4)',
    glowWarning: '0 0 20px rgba(245, 158, 11, 0.4)',

    // Card shadows
    card: '0 4px 20px rgba(0, 0, 0, 0.3)',
    cardHover: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.15)',

    // Floating elements
    floating: '0 8px 30px rgba(0, 0, 0, 0.5)',
    modal: '0 20px 40px rgba(0, 0, 0, 0.6)',
} as const;

export const blur = {
    none: '0',
    sm: '4px',
    DEFAULT: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
} as const;

export const opacity = {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
} as const;

// Backdrop effects
export const backdrop = {
    blur: 'blur(12px)',
    blurLight: 'blur(8px)',
    blurHeavy: 'blur(20px)',
    saturate: 'saturate(180%)',
} as const;

// Z-index scale
export const zIndex = {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
} as const;

export type Shadow = keyof typeof shadows;
export type Blur = keyof typeof blur;
export type ZIndex = keyof typeof zIndex;
