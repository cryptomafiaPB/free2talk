/**
 * Animation System - Free2Talk Design Tokens
 * 
 * Smooth, performant animations
 */

export const duration = {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
} as const;

export const easing = {
    // Standard easings
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',

    // Custom cubic-bezier for smooth feel
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',
    smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',

    // Spring-like
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Pre-defined transitions
export const transitions = {
    // Common transitions
    default: `all ${duration.normal} ${easing.smooth}`,
    fast: `all ${duration.fast} ${easing.smooth}`,
    slow: `all ${duration.slow} ${easing.smooth}`,

    // Specific properties
    opacity: `opacity ${duration.normal} ${easing.smooth}`,
    transform: `transform ${duration.normal} ${easing.smooth}`,
    colors: `background-color ${duration.normal} ${easing.smooth}, border-color ${duration.normal} ${easing.smooth}, color ${duration.normal} ${easing.smooth}`,
    shadow: `box-shadow ${duration.normal} ${easing.smooth}`,

    // Interactive
    button: `all ${duration.fast} ${easing.smooth}`,
    hover: `all ${duration.fast} ${easing.smoothOut}`,
    focus: `outline ${duration.fast} ${easing.smooth}, box-shadow ${duration.fast} ${easing.smooth}`,
} as const;

// Keyframe animations (for CSS)
export const keyframes = {
    fadeIn: {
        from: { opacity: '0' },
        to: { opacity: '1' },
    },
    fadeOut: {
        from: { opacity: '1' },
        to: { opacity: '0' },
    },
    slideInUp: {
        from: { transform: 'translateY(100%)', opacity: '0' },
        to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideInDown: {
        from: { transform: 'translateY(-100%)', opacity: '0' },
        to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideInLeft: {
        from: { transform: 'translateX(-100%)', opacity: '0' },
        to: { transform: 'translateX(0)', opacity: '1' },
    },
    slideInRight: {
        from: { transform: 'translateX(100%)', opacity: '0' },
        to: { transform: 'translateX(0)', opacity: '1' },
    },
    scaleIn: {
        from: { transform: 'scale(0.95)', opacity: '0' },
        to: { transform: 'scale(1)', opacity: '1' },
    },
    pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
    },
    spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    },
    // Voice/Speaking animation
    speaking: {
        '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
        '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
    },
    // Sound wave animation
    soundWave: {
        '0%, 100%': { transform: 'scaleY(0.5)' },
        '50%': { transform: 'scaleY(1)' },
    },
} as const;

// Framer Motion variants
export const motionVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    slideDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
    stagger: {
        animate: {
            transition: {
                staggerChildren: 0.1,
            },
        },
    },
} as const;

export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
