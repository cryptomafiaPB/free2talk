/**
 * Typography System - Free2Talk Design Tokens
 * 
 * Mobile-first typography scale
 */

export const fontFamily = {
    sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['var(--font-geist-mono)', 'Consolas', 'Monaco', 'monospace'],
} as const;

export const fontSize = {
    // Mobile-first sizes
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
} as const;

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const letterSpacing = {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
} as const;

// Pre-defined text styles
export const textStyles = {
    // Headings
    h1: {
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.bold,
        letterSpacing: letterSpacing.tight,
    },
    h2: {
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.semibold,
        letterSpacing: letterSpacing.tight,
    },
    h3: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        letterSpacing: letterSpacing.normal,
    },
    h4: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.medium,
        letterSpacing: letterSpacing.normal,
    },

    // Body text
    bodyLarge: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    body: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.normal,
        letterSpacing: letterSpacing.normal,
    },
    bodySmall: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.normal,
        letterSpacing: letterSpacing.normal,
    },

    // UI text
    caption: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.normal,
        letterSpacing: letterSpacing.wide,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        letterSpacing: letterSpacing.normal,
    },
    button: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        letterSpacing: letterSpacing.wide,
    },
} as const;

export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type TextStyle = keyof typeof textStyles;
