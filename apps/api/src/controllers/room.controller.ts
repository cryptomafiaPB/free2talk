import type { Request, Response, NextFunction } from 'express';
import { createRoomSchema } from '@free2talk/shared';
import { AppError } from '../utils/app-error.js';
import * as roomService from '../services/room.service.js';
import { z } from 'zod';
import { paginationSchema, updateRoomSchema } from '../utils/validation.js';

//  * GET /rooms
//  * List all active rooms with pagination

export async function listRooms(req: Request, res: Response, next: NextFunction) {
    try {
        const { page, limit, language } = paginationSchema.parse(req.query);

        const result = await roomService.listActiveRooms(page, limit, language);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

//  * GET /rooms/:id
//  * Get room details by ID or slug

export async function getRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        const room = await roomService.getRoomById(id);

        res.json({
            success: true,
            data: room,
        });
    } catch (error) {
        next(error);
    }
}

//  * GET /rooms/:id/participants
//  * Get all participants in a room

export async function getRoomParticipants(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        // Verify room exists
        await roomService.getRoomById(id);

        const participants = await roomService.getRoomParticipants(id);

        res.json({
            success: true,
            data: participants,
        });
    } catch (error) {
        next(error);
    }
}

//  * POST /rooms
//  * Create a new room

export async function createRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        // Validate input
        const validatedData = createRoomSchema.parse(req.body);

        const room = await roomService.createRoom(userId, validatedData);

        res.status(201).json({
            success: true,
            data: room,
            message: 'Room created successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * PUT /rooms/:id
//  * Update room details (owner only)
export async function updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        // Validate input
        const validatedData = updateRoomSchema.parse(req.body);

        if (Object.keys(validatedData).length === 0) {
            return next(new AppError('No valid update fields provided', 400));
        }

        const room = await roomService.updateRoom(id, userId, validatedData);

        res.json({
            success: true,
            data: room,
            message: 'Room updated successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * POST /rooms/:id/join
//  * Join a room
export async function joinRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        const result = await roomService.joinRoom(id, userId);

        res.json({
            success: true,
            data: result,
            message: 'Joined room successfully',
        });
    } catch (error) {
        next(error);
    }
}


//  * POST /rooms/:id/leave
//  * Leave a room

export async function leaveRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        await roomService.leaveRoom(id, userId);

        res.json({
            success: true,
            message: 'Left room successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * DELETE /rooms/:id
//  * Close a room (owner only)

export async function closeRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        await roomService.closeRoom(id, userId);

        res.json({
            success: true,
            message: 'Room closed successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * POST /rooms/:id/kick/:userId
//  * Kick a user from a room (owner only)

export async function kickUser(req: Request, res: Response, next: NextFunction) {
    try {
        const ownerId = req.user?.userId;
        const { id: roomId, userId: targetUserId } = req.params;

        if (!ownerId) {
            return next(new AppError('Authentication required', 401));
        }

        await roomService.kickUser(roomId, ownerId, targetUserId);

        res.json({
            success: true,
            message: 'User kicked successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * POST /rooms/:id/transfer/:userId
//  * Transfer room ownership (owner only)

export async function transferOwnership(req: Request, res: Response, next: NextFunction) {
    try {
        const currentOwnerId = req.user?.userId;
        const { id: roomId, userId: newOwnerId } = req.params;

        if (!currentOwnerId) {
            return next(new AppError('Authentication required', 401));
        }

        await roomService.transferOwnership(roomId, currentOwnerId, newOwnerId);

        res.json({
            success: true,
            message: 'Ownership transferred successfully',
        });
    } catch (error) {
        next(error);
    }
}

//  * GET /rooms/user/owned
//  * Get rooms owned by the current user

export async function getUserOwnedRooms(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        const rooms = await roomService.getUserRooms(userId);

        res.json({
            success: true,
            data: rooms,
        });
    } catch (error) {
        next(error);
    }
}

//  * GET /rooms/user/current
//  * Get the current room the user is in

export async function getUserCurrentRoom(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        const room = await roomService.getUserCurrentRoom(userId);

        res.json({
            success: true,
            data: room,
        });
    } catch (error) {
        next(error);
    }
}
