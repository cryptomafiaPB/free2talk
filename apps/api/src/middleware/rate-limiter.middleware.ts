import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../db/redis.js';

/**
 * Rate limiter for authentication endpoints (register, login)
 * Limit: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
        prefix: 'rl:auth:',
    }),
    // Skip rate limiting for successful requests (only count failed attempts)
    skip: (req, res) => res.statusCode < 400,
});

/**
 * Rate limiter for room creation
 * Limit: 10 rooms per hour per user
 */
export const roomCreationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 rooms per hour
    message: {
        success: false,
        message: 'Too many rooms created, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
        prefix: 'rl:room:create:',
    }),
    // Key by user ID instead of IP
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'anonymous';
    },
});

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
        prefix: 'rl:api:',
    }),
});

/**
 * Strict rate limiter for sensitive operations (password reset, email verification)
 * Limit: 3 requests per hour per IP
 */
export const strictRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: {
        success: false,
        message: 'Too many requests, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
        prefix: 'rl:strict:',
    }),
});
