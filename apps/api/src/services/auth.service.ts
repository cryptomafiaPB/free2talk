import { loginSchema, registerSchema } from "@free2talk/shared";
import { db } from "../db";
import { eq, or } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateTokenPair, TokenPair, TokenPayload, verifyRefreshToken } from "../utils/JWT";
import { AppError } from "../utils/app-error";


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

        // Update online status
        await db.update(users)
            .set({ isOnline: true })
            .where(eq(users.id, user.id));

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

        // Update online status
        await db.update(users)
            .set({ isOnline: true })
            .where(eq(users.id, user.id));


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
        throw new Error('Invalid refresh token');
    }

    // Generate new token pair [web:34]
    const newTokens = generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        username: payload.username
    });


    return newTokens;
}

export async function logoutService(userId: string) {
    try {
        // Update online status
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