import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance
export const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    withCredentials: true,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management - using module-level closure for performance
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Token setters (called from auth store)
export const setAuthTokens = (access: string | null, refresh: string | null) => {
    accessToken = access;
    refreshToken = refresh;
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;
export const isTokenRefreshing = () => isRefreshing;

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Notify all subscribers with new token
const onTokenRefreshed = (newToken: string) => {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh with queue
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only handle 401 errors and avoid infinite loops
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Don't try to refresh on refresh endpoint
        if (originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken: string) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    resolve(api(originalRequest));
                });
            });
        }

        isRefreshing = true;

        try {
            // Try to refresh using cookie first (httpOnly), then fall back to header
            const refreshResponse = await axios.post(
                `${API_URL}/api/v1/auth/refresh`,
                {},
                {
                    withCredentials: true,
                    headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
                }
            );

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

            // Update tokens
            accessToken = newAccessToken;
            if (newRefreshToken) {
                refreshToken = newRefreshToken;
            }

            // Notify store of new tokens (will be connected via hook)
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('auth:tokens-refreshed', {
                        detail: { accessToken: newAccessToken, refreshToken: newRefreshToken },
                    })
                );
            }

            // Notify all queued requests
            onTokenRefreshed(newAccessToken);

            // Retry original request with new token
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh failed - clear auth state and redirect to login
            accessToken = null;
            refreshToken = null;

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:logout'));
                // Don't redirect immediately - let the app handle it gracefully
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiError {
    success: false;
    message: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
}

// Type-safe API methods
export const apiClient = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        api.get<ApiResponse<T>>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        api.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

/**
 * Force a token refresh out-of-band (e.g., for socket connect errors)
 */
export async function forceRefreshTokens(): Promise<{ accessToken: string; refreshToken?: string }> {
    const refreshResponse = await axios.post(
        `${API_URL}/api/v1/auth/refresh`,
        {},
        {
            withCredentials: true,
            headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
        }
    );

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

    // Update module-level tokens
    accessToken = newAccessToken;
    if (newRefreshToken) {
        refreshToken = newRefreshToken;
    }

    // Notify store and listeners
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('auth:tokens-refreshed', {
                detail: { accessToken: newAccessToken, refreshToken: newRefreshToken },
            })
        );
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
