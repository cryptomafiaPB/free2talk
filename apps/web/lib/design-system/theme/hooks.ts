'use client';

import { useEffect, useState, useCallback } from 'react';
import { breakpoints, type Breakpoint } from '../tokens/breakpoints';

/**
 * Hook to check if a media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * Hook to check current breakpoint
 */
export function useBreakpoint() {
    const isXs = useMediaQuery(`(min-width: ${breakpoints.xs})`);
    const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
    const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
    const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
    const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
    const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

    const current: Breakpoint = is2xl ? '2xl' : isXl ? 'xl' : isLg ? 'lg' : isMd ? 'md' : isSm ? 'sm' : 'xs';

    return {
        current,
        isXs,
        isSm,
        isMd,
        isLg,
        isXl,
        is2xl,
        isMobile: !isMd,
        isTablet: isMd && !isLg,
        isDesktop: isLg,
    };
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect if device is touch-based
 */
export function useIsTouchDevice(): boolean {
    return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/**
 * Hook for window size
 */
export function useWindowSize() {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return size;
}

/**
 * Hook for scroll position
 */
export function useScrollPosition() {
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return scrollPosition;
}

/**
 * Hook to detect if element is in viewport
 */
export function useInView(
    ref: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, options);

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, options]);

    return isInView;
}

/**
 * Hook for keyboard shortcut detection
 */
export function useKeyboardShortcut(
    keys: string[],
    callback: () => void,
    options?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            const { ctrl, shift, alt } = options || {};

            if (ctrl && !event.ctrlKey) return;
            if (shift && !event.shiftKey) return;
            if (alt && !event.altKey) return;

            if (keys.includes(event.key.toLowerCase())) {
                event.preventDefault();
                callback();
            }
        },
        [keys, callback, options]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/**
 * Hook for local storage with SSR support
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error('Error setting localStorage:', error);
        }
    };

    return [storedValue, setValue] as const;
}
