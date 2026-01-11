/**
 * Free2Talk Design System
 * 
 * Central export for all design system utilities
 */

// Tokens
export * from './tokens';

// Theme
export * from './theme';

// Utility function for class names
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
