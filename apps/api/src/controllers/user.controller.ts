import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NextFunction, Request, Response } from 'express';
import type { User, UserProfile } from '../../../../packages/shared/src/types/user';
import { AppError } from '../utils/app-error';
import { UserCache } from '../services/cache.service';

// Get user profile by ID
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Check cache first
        const cached = await UserCache.getUser(id);
        if (cached) {
            return res.json(cached);
        }

        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!user.length) {
            return next(new AppError('User not found', 404));
        }
        // Remove sensitive info
        const { email, passwordHash, ...publicProfile } = user[0];

        // Cache the result
        await UserCache.cacheUser(id, publicProfile);

        res.json(publicProfile);
    } catch (err) {
        next(err);
    }
};

// List all users (basic info)
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allUsers = await db.select().from(users);
        const publicUsers = allUsers.map(({ email, passwordHash, ...rest }) => rest);
        res.json(publicUsers);
    } catch (err) {
        next(err);
    }
};

// Update user profile (self only)
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (userId !== id) {
            return next(new AppError('Unauthorized', 401));
        }

        const updateData = req.body;
        const updated = await db.update(users).set({ ...updateData, updatedAt: new Date() }).where(eq(users.id, id)).returning();
        if (!updated.length) {
            return next(new AppError('User not found', 404));
        }
        const { email, passwordHash, ...publicProfile } = updated[0];

        // Invalidate cache
        await UserCache.invalidateUser(id);

        res.json(publicProfile);
    } catch (err) {
        next(err);
    }
};

// Delete user (self only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const userId = req.user?.userId;

        if (userId !== id) {
            return next(new AppError('Unauthorized', 401));
        }

        const deleted = await db.delete(users).where(eq(users.id, id)).returning();
        if (!deleted.length) {
            return next(new AppError('User not found', 404));
        }
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};
