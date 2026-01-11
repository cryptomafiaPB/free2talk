/**
 * Spacing System - Free2Talk Design Tokens
 * 
 * 4px base unit system
 */

export const spacing = {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
} as const;

// Component-specific spacing
export const componentSpacing = {
    // Cards
    cardPadding: spacing[4],
    cardPaddingLg: spacing[6],
    cardGap: spacing[3],

    // Buttons
    buttonPaddingX: spacing[4],
    buttonPaddingY: spacing[2],
    buttonPaddingXSm: spacing[3],
    buttonPaddingYSm: spacing[1.5],
    buttonPaddingXLg: spacing[6],
    buttonPaddingYLg: spacing[3],

    // Inputs
    inputPaddingX: spacing[3],
    inputPaddingY: spacing[2],

    // Layout
    containerPadding: spacing[4],
    containerPaddingLg: spacing[6],
    sectionGap: spacing[8],

    // Navigation
    navHeight: '3.5rem',     // 56px mobile
    navHeightLg: '4rem',     // 64px desktop
    bottomNavHeight: '4rem', // 64px
    sidebarWidth: '16rem',   // 256px
    sidebarWidthCollapsed: '4.5rem', // 72px
} as const;

// Border radius
export const borderRadius = {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.625rem',   // 10px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
