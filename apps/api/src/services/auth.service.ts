import { loginSchema, registerSchema } from "@free2talk/shared";
import { db } from "../db";
import { eq, or } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateTokenPair, TokenPair, TokenPayload, verifyRefreshToken } from "../utils/JWT";
import { AppError } from "../utils/app-error";
import { SessionCache, UserCache } from './cache.service';
import { CACHE_TTL } from "../db/redis";


export async function registerService(data: ReturnType<typeof registerSchema.safeParse>) {
    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: or(
                eq(users.email, data.data!.email),
                eq(users.username, data.data!.username)
            )
        });

        if (existingUser) {
            throw new AppError('User with this email or username already exists', 400);
        }

        // Hash password
        const hashedPassword = await hashPassword(data.data!.password);
        // Create user
        const [user] = await db
            .insert(users)
            .values({
                email: data.data!.email,
                username: data.data!.username,
                passwordHash: hashedPassword
            })
            .returning();

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: String(user!.id),
            email: user!.email,
            username: user!.username
        };

        const tokens = generateTokenPair(tokenPayload);

        // Store refresh token in Redis
        await SessionCache.storeRefreshToken(user.id, tokens.refreshToken, CACHE_TTL.SESSION);

        // Update online status
        await db.update(users)
            .set({ isOnline: true })
            .where(eq(users.id, user.id));

        // Set online in Redis
        await UserCache.setOnline(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        }

    } catch (error) {
        throw error;
    }
}

export async function loginService(data: ReturnType<typeof loginSchema.safeParse>) {
    try {
        // Find user in DB
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.data!.email)
        });


        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check if user has a password (OAuth-only users don't have one)
        if (!user.passwordHash) {
            throw new AppError('Please sign in with Google instead', 401);
        }

        const isPasswordValid = await verifyPassword(data.data!.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate JWT token
        const tokenPayload: TokenPayload = {
            userId: String(user.id),
            email: user.email,
            username: user.username
        };

        const tokens: TokenPair = generateTokenPair(tokenPayload);

        // Store refresh token in Redis
        await SessionCache.storeRefreshToken(user.id, tokens.refreshToken, CACHE_TTL.SESSION);

        // Update online status
        await db.update(users)
            .set({ isOnline: true })
            .where(eq(users.id, user.id));

        // Set online in Redis
        await UserCache.setOnline(user.id);


        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            }
        }
    } catch (error) {
        throw error;
    }
}

export async function refreshTokenService(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
        throw new AppError('Invalid refresh token', 401);
    }

    // Check if refresh token exists in Redis
    const storedToken = await SessionCache.getRefreshToken(refreshToken);

    if (!storedToken) {
        throw new AppError('Refresh token revoked or expired', 401);
    }

    // Delete old refresh token (by token, not userId)
    await SessionCache.deleteRefreshToken(refreshToken);

    // Generate new token pair
    const newTokens = generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        username: payload.username
    });

    // Store new refresh token in Redis
    await SessionCache.storeRefreshToken(payload.userId, newTokens.refreshToken, CACHE_TTL.SESSION);

    return newTokens;
}

export async function logoutService(userId: string) {
    try {
        // Delete refresh token from Redis by userId
        await SessionCache.deleteRefreshTokenByUserId(userId);

        // Set offline in Redis
        await UserCache.setOffline(userId);

        // Invalidate user cache
        await UserCache.invalidateUser(userId);

        // Update online status in DB
        await db.update(users)
            .set({ isOnline: false })
            .where(eq(users.id, userId));
    } catch (error) {
        throw error;
    }
}

export async function getUserWithProfile(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, (userId))
    });

    if (!user) {
        throw new AppError('User not found');
    }

    return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        nativeLanguages: user.nativeLanguages,
        learningLanguages: user.learningLanguages,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}