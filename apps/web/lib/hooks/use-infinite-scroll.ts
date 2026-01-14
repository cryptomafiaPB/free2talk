'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseInfiniteScrollOptions<T> {
    /** Initial data (optional) */
    initialData?: T[];
    /** Fetch function that receives page number */
    fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>;
    /** Number of items per page */
    pageSize?: number;
    /** Root margin for intersection observer (px from bottom to trigger) */
    rootMargin?: string;
    /** Whether to fetch on mount */
    fetchOnMount?: boolean;
    /** Dependencies that should trigger a reset */
    deps?: any[];
}

export interface UseInfiniteScrollReturn<T> {
    /** All loaded items */
    items: T[];
    /** Whether currently loading */
    isLoading: boolean;
    /** Whether initial loading */
    isInitialLoading: boolean;
    /** Whether there are more items */
    hasMore: boolean;
    /** Total count if available */
    total: number | null;
    /** Current page */
    page: number;
    /** Error if any */
    error: Error | null;
    /** Ref to attach to sentinel element */
    sentinelRef: (node: HTMLElement | null) => void;
    /** Manual load more function */
    loadMore: () => Promise<void>;
    /** Reset and reload */
    reset: () => void;
    /** Prepend items (for real-time additions) */
    prepend: (newItems: T[]) => void;
    /** Update an item */
    updateItem: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
    /** Remove an item */
    removeItem: (predicate: (item: T) => boolean) => void;
}

export function useInfiniteScroll<T>({
    initialData = [],
    fetchFn,
    pageSize = 12,
    rootMargin = '200px',
    fetchOnMount = true,
    deps = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
    const [items, setItems] = useState<T[]>(initialData);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(fetchOnMount);
    const [error, setError] = useState<Error | null>(null);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef(false);
    const hasLoadedRef = useRef(false);

    // Fetch data for a specific page
    const fetchPage = useCallback(async (pageNum: number, isReset = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;

        try {
            setIsLoading(true);
            setError(null);

            const result = await fetchFn(pageNum);

            setItems(prev => isReset ? result.data : [...prev, ...result.data]);
            setHasMore(result.hasMore);
            if (result.total !== undefined) {
                setTotal(result.total);
            }
            setPage(pageNum);
            hasLoadedRef.current = true;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch'));
            console.error('Infinite scroll fetch error:', err);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
            loadingRef.current = false;
        }
    }, [fetchFn]);

    // Load more function
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingRef.current) return;
        await fetchPage(page + 1);
    }, [fetchPage, hasMore, page]);

    // Reset function
    const reset = useCallback(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        setTotal(null);
        setError(null);
        hasLoadedRef.current = false;
        setIsInitialLoading(true);
        fetchPage(1, true);
    }, [fetchPage]);

    // Prepend items (for real-time additions)
    const prepend = useCallback((newItems: T[]) => {
        setItems(prev => [...newItems, ...prev]);
        setTotal(prev => prev !== null ? prev + newItems.length : null);
    }, []);

    // Update an item
    const updateItem = useCallback((
        predicate: (item: T) => boolean,
        updater: (item: T) => T
    ) => {
        setItems(prev => prev.map(item => predicate(item) ? updater(item) : item));
    }, []);

    // Remove an item
    const removeItem = useCallback((predicate: (item: T) => boolean) => {
        setItems(prev => prev.filter(item => !predicate(item)));
        setTotal(prev => prev !== null ? Math.max(0, prev - 1) : null);
    }, []);

    // Intersection Observer callback ref
    const sentinelRef = useCallback((node: HTMLElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (!node) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !loadingRef.current) {
                    loadMore();
                }
            },
            { rootMargin }
        );

        observerRef.current.observe(node);
    }, [hasMore, loadMore, rootMargin]);

    // Initial fetch
    useEffect(() => {
        if (fetchOnMount && !hasLoadedRef.current) {
            fetchPage(1, true);
        }
    }, [fetchOnMount, fetchPage]);

    // Reset when dependencies change
    useEffect(() => {
        if (hasLoadedRef.current && deps.length > 0) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    // Cleanup
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return {
        items,
        isLoading,
        isInitialLoading,
        hasMore,
        total,
        page,
        error,
        sentinelRef,
        loadMore,
        reset,
        prepend,
        updateItem,
        removeItem,
    };
}
