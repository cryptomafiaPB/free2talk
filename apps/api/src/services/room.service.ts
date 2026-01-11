import { db } from '../db/index.js';
import { rooms, roomParticipants, users } from '../db/schema.js';
import { eq, and, isNull, desc, sql, count } from 'drizzle-orm';
import { AppError } from '../utils/app-error.js';
import type { CreateRoomInput } from '@free2talk/shared';
import { ParticipantInfo, RoomWithParticipants } from '../utils/types.js';
import { RoomCache, UserCache } from './cache.service.js';


// Helper: Generate a URL-friendly slug from room name
function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
}

/**
 * List all active rooms with participant counts
 */
export async function listActiveRooms(
    page = 1,
    limit = 20,
    language?: string
): Promise<{ rooms: RoomWithParticipants[]; total: number; page: number; totalPages: number }> {
    // Check cache first
    const cached = await RoomCache.getRoomsList(page, limit, language);
    if (cached) {
        return cached;
    }

    const offset = (page - 1) * limit;

    // Build the query for active rooms
    const activeRoomsQuery = db
        .select({
            id: rooms.id,
            name: rooms.name,
            slug: rooms.slug,
            ownerId: rooms.ownerId,
            topic: rooms.topic,
            languages: rooms.languages,
            maxParticipants: rooms.maxParticipants,
            isActive: rooms.isActive,
            createdAt: rooms.createdAt,
            closedAt: rooms.closedAt,
            ownerUsername: users.username,
            ownerDisplayName: users.displayName,
            ownerAvatarUrl: users.avatarUrl,
        })
        .from(rooms)
        .innerJoin(users, eq(rooms.ownerId, users.id))
        .where(eq(rooms.isActive, true))
        .orderBy(desc(rooms.createdAt))
        .limit(limit)
        .offset(offset);

    const activeRooms = await activeRoomsQuery;

    // Get participant counts for each room
    const roomIds = activeRooms.map(r => r.id);

    const participantCounts = roomIds.length > 0
        ? await db
            .select({
                roomId: roomParticipants.roomId,
                count: count(),
            })
            .from(roomParticipants)
            .where(
                and(
                    sql`${roomParticipants.roomId} IN ${roomIds}`,
                    isNull(roomParticipants.leftAt)
                )
            )
            .groupBy(roomParticipants.roomId)
        : [];

    const countMap = new Map(participantCounts.map(pc => [pc.roomId, Number(pc.count)]));

    // Get total count for pagination
    const [totalResult] = await db
        .select({ count: count() })
        .from(rooms)
        .where(eq(rooms.isActive, true));

    const total = Number(totalResult?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Filter by language if specified
    let filteredRooms = activeRooms;
    if (language) {
        filteredRooms = activeRooms.filter(r =>
            r.languages?.some(l => l.toLowerCase() === language.toLowerCase())
        );
    }

    const result: RoomWithParticipants[] = filteredRooms.map(room => ({
        id: room.id,
        name: room.name,
        slug: room.slug,
        ownerId: room.ownerId,
        topic: room.topic,
        languages: room.languages,
        maxParticipants: room.maxParticipants,
        isActive: room.isActive,
        createdAt: room.createdAt,
        closedAt: room.closedAt,
        participantCount: countMap.get(room.id) || 0,
        owner: {
            id: room.ownerId,
            username: room.ownerUsername,
            displayName: room.ownerDisplayName,
            avatarUrl: room.ownerAvatarUrl,
        },
    }));

    const response = { rooms: result, total, page, totalPages };

    // Cache the result
    await RoomCache.cacheRoomsList(page, limit, language, response);

    return response;
}

/**
 * Get room by ID or slug with full details
 */
export async function getRoomById(roomIdOrSlug: string): Promise<RoomWithParticipants> {
    // Check cache first
    const cached = await RoomCache.getRoom(roomIdOrSlug);
    if (cached) {
        return cached;
    }

    // Try to find by ID first, then by slug
    const roomResult = await db
        .select({
            id: rooms.id,
            name: rooms.name,
            slug: rooms.slug,
            ownerId: rooms.ownerId,
            topic: rooms.topic,
            languages: rooms.languages,
            maxParticipants: rooms.maxParticipants,
            isActive: rooms.isActive,
            createdAt: rooms.createdAt,
            closedAt: rooms.closedAt,
            ownerUsername: users.username,
            ownerDisplayName: users.displayName,
            ownerAvatarUrl: users.avatarUrl,
        })
        .from(rooms)
        .innerJoin(users, eq(rooms.ownerId, users.id))
        .where(
            sql`${rooms.id}::text = ${roomIdOrSlug} OR ${rooms.slug} = ${roomIdOrSlug}`
        )
        .limit(1);

    if (!roomResult.length) {
        throw new AppError('Room not found', 404);
    }

    const room = roomResult[0];

    // Get participant count
    const [participantCount] = await db
        .select({ count: count() })
        .from(roomParticipants)
        .where(
            and(
                eq(roomParticipants.roomId, room.id),
                isNull(roomParticipants.leftAt)
            )
        );

    const result: RoomWithParticipants = {
        id: room.id,
        name: room.name,
        slug: room.slug,
        ownerId: room.ownerId,
        topic: room.topic,
        languages: room.languages,
        maxParticipants: room.maxParticipants,
        isActive: room.isActive,
        createdAt: room.createdAt,
        closedAt: room.closedAt,
        participantCount: Number(participantCount?.count || 0),
        owner: {
            id: room.ownerId,
            username: room.ownerUsername,
            displayName: room.ownerDisplayName,
            avatarUrl: room.ownerAvatarUrl,
        },
    };

    // Cache the result
    await RoomCache.cacheRoom(room.id, result);
    if (room.slug) {
        await RoomCache.cacheRoom(room.slug, result);
    }

    return result;
}

/**
 * Get all participants in a room
 */
export async function getRoomParticipants(roomId: string): Promise<ParticipantInfo[]> {
    // Check cache first
    const cached = await RoomCache.getParticipants(roomId);
    if (cached) {
        return cached;
    }

    const participants = await db
        .select({
            id: roomParticipants.id,
            oderId: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            role: roomParticipants.role,
            joinedAt: roomParticipants.joinedAt,
        })
        .from(roomParticipants)
        .innerJoin(users, eq(roomParticipants.userId, users.id))
        .where(
            and(
                eq(roomParticipants.roomId, roomId),
                isNull(roomParticipants.leftAt)
            )
        )
        .orderBy(roomParticipants.joinedAt);

    // Cache the result
    await RoomCache.cacheParticipants(roomId, participants);

    return participants;
}

/**
 * Create a new room
 */
export async function createRoom(
    userId: string,
    input: CreateRoomInput
): Promise<RoomWithParticipants> {
    // Check if user exists
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check if user already owns an active room
    const existingRoom = await db.query.rooms.findFirst({
        where: and(
            eq(rooms.ownerId, userId),
            eq(rooms.isActive, true)
        ),
    });

    if (existingRoom) {
        throw new AppError('You already have an active room. Please close it before creating a new one.', 400);
    }

    // Generate unique slug
    const slug = generateSlug(input.name);

    // Create the room
    const [newRoom] = await db
        .insert(rooms)
        .values({
            name: input.name,
            slug,
            ownerId: userId,
            topic: input.topic,
            languages: input.languages,
            maxParticipants: input.maxParticipants || 12,
        })
        .returning();

    // Add owner as first participant
    await db.insert(roomParticipants).values({
        roomId: newRoom.id,
        userId,
        role: 'owner',
    });

    // Invalidate rooms list cache and add to active rooms
    await RoomCache.invalidateRoomsList();
    await RoomCache.addActiveRoom(newRoom.id);
    await UserCache.cacheUserRoom(userId, newRoom.id);

    return {
        id: newRoom.id,
        name: newRoom.name,
        slug: newRoom.slug,
        ownerId: newRoom.ownerId,
        topic: newRoom.topic,
        languages: newRoom.languages,
        maxParticipants: newRoom.maxParticipants,
        isActive: newRoom.isActive,
        createdAt: newRoom.createdAt,
        closedAt: newRoom.closedAt,
        participantCount: 1,
        owner: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        },
    };
}

/**
 * Join a room
 */
export async function joinRoom(roomId: string, userId: string): Promise<{ room: RoomWithParticipants; participant: ParticipantInfo }> {
    // Get room details
    const room = await getRoomById(roomId);

    if (!room.isActive) {
        throw new AppError('This room is no longer active', 400);
    }

    // Check if user is already in the room
    const existingParticipant = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.roomId, room.id),
            eq(roomParticipants.userId, userId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (existingParticipant) {
        throw new AppError('You are already in this room', 400);
    }

    // Check if room is full
    if (room.participantCount >= room.maxParticipants) {
        throw new AppError('This room is full', 400);
    }

    // Check if user is in another room
    const userInOtherRoom = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.userId, userId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (userInOtherRoom) {
        throw new AppError('You must leave your current room before joining another', 400);
    }

    // Get user details
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Add user as participant
    const [participant] = await db
        .insert(roomParticipants)
        .values({
            roomId: room.id,
            userId,
            role: 'participant',
        })
        .returning();

    // Invalidate caches
    await RoomCache.invalidateRoom(room.id);
    await UserCache.cacheUserRoom(userId, room.id);

    return {
        room: { ...room, participantCount: room.participantCount + 1 },
        participant: {
            id: participant.id,
            oderId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            role: participant.role,
            joinedAt: participant.joinedAt,
        },
    };
}

/**
 * Leave a room
 */
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
    // Find the participant record
    const participant = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.userId, userId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (!participant) {
        throw new AppError('You are not in this room', 400);
    }

    // If owner is leaving, close the room or transfer ownership
    if (participant.role === 'owner') {
        // Find another participant to transfer ownership
        const otherParticipant = await db.query.roomParticipants.findFirst({
            where: and(
                eq(roomParticipants.roomId, roomId),
                isNull(roomParticipants.leftAt),
                sql`${roomParticipants.userId} != ${userId}`
            ),
        });

        if (otherParticipant) {
            // Transfer ownership
            await db
                .update(roomParticipants)
                .set({ role: 'owner' })
                .where(eq(roomParticipants.id, otherParticipant.id));

            await db
                .update(rooms)
                .set({ ownerId: otherParticipant.userId })
                .where(eq(rooms.id, roomId));
        } else {
            // No other participants, close the room
            await db
                .update(rooms)
                .set({ isActive: false, closedAt: new Date() })
                .where(eq(rooms.id, roomId));
        }
    }

    // Mark participant as left
    await db
        .update(roomParticipants)
        .set({ leftAt: new Date() })
        .where(eq(roomParticipants.id, participant.id));

    // Invalidate caches
    await RoomCache.invalidateRoom(roomId);
    await UserCache.cacheUserRoom(userId, null);
}

/**
 * Close a room (owner only)
 */
export async function closeRoom(roomId: string, userId: string): Promise<void> {
    // Get room
    const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
    });

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    if (room.ownerId !== userId) {
        throw new AppError('Only the room owner can close the room', 403);
    }

    if (!room.isActive) {
        throw new AppError('Room is already closed', 400);
    }

    // Mark all participants as left
    await db
        .update(roomParticipants)
        .set({ leftAt: new Date() })
        .where(
            and(
                eq(roomParticipants.roomId, roomId),
                isNull(roomParticipants.leftAt)
            )
        );

    // Close the room
    await db
        .update(rooms)
        .set({ isActive: false, closedAt: new Date() })
        .where(eq(rooms.id, roomId));

    // Invalidate caches
    await RoomCache.invalidateRoom(roomId);
    await RoomCache.removeActiveRoom(roomId);
    await RoomCache.invalidateRoomsList();
}

/**
 * Kick a user from a room (owner only)
 */
export async function kickUser(roomId: string, ownerId: string, targetUserId: string): Promise<void> {
    // Get room
    const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
    });

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    if (room.ownerId !== ownerId) {
        throw new AppError('Only the room owner can kick users', 403);
    }

    if (targetUserId === ownerId) {
        throw new AppError('You cannot kick yourself', 400);
    }

    // Find target participant
    const targetParticipant = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.userId, targetUserId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (!targetParticipant) {
        throw new AppError('User is not in this room', 400);
    }

    // Kick user
    await db
        .update(roomParticipants)
        .set({ leftAt: new Date() })
        .where(eq(roomParticipants.id, targetParticipant.id));

    // Invalidate caches
    await RoomCache.invalidateRoom(roomId);
    await UserCache.cacheUserRoom(targetUserId, null);
}

/**
 * Transfer room ownership
 */
export async function transferOwnership(
    roomId: string,
    currentOwnerId: string,
    newOwnerId: string
): Promise<void> {
    // Get room
    const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
    });

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    if (room.ownerId !== currentOwnerId) {
        throw new AppError('Only the room owner can transfer ownership', 403);
    }

    if (currentOwnerId === newOwnerId) {
        throw new AppError('You are already the owner', 400);
    }

    // Check if new owner is in the room
    const newOwnerParticipant = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.userId, newOwnerId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (!newOwnerParticipant) {
        throw new AppError('Target user is not in this room', 400);
    }

    // Get current owner participant record
    const currentOwnerParticipant = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.roomId, roomId),
            eq(roomParticipants.userId, currentOwnerId),
            isNull(roomParticipants.leftAt)
        ),
    });

    // Update room owner
    await db
        .update(rooms)
        .set({ ownerId: newOwnerId })
        .where(eq(rooms.id, roomId));

    // Update participant roles
    await db
        .update(roomParticipants)
        .set({ role: 'participant' })
        .where(eq(roomParticipants.id, currentOwnerParticipant!.id));

    await db
        .update(roomParticipants)
        .set({ role: 'owner' })
        .where(eq(roomParticipants.id, newOwnerParticipant.id));

    // Invalidate cache
    await RoomCache.invalidateRoom(roomId);
}

/**
 * Update room details (owner only)
 */
export async function updateRoom(
    roomId: string,
    userId: string,
    updates: Partial<Pick<typeof rooms.$inferSelect, 'name' | 'topic' | 'maxParticipants'>>
): Promise<RoomWithParticipants> {
    // Get room
    const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
    });

    if (!room) {
        throw new AppError('Room not found', 404);
    }

    if (room.ownerId !== userId) {
        throw new AppError('Only the room owner can update room details', 403);
    }

    if (!room.isActive) {
        throw new AppError('Cannot update a closed room', 400);
    }

    // If max participants is being reduced, check current count
    if (updates.maxParticipants) {
        const [currentCount] = await db
            .select({ count: count() })
            .from(roomParticipants)
            .where(
                and(
                    eq(roomParticipants.roomId, roomId),
                    isNull(roomParticipants.leftAt)
                )
            );

        if (updates.maxParticipants < Number(currentCount?.count || 0)) {
            throw new AppError(
                `Cannot reduce max participants below current count (${currentCount?.count})`,
                400
            );
        }
    }

    // Update room
    await db
        .update(rooms)
        .set(updates)
        .where(eq(rooms.id, roomId));

    // Invalidate cache
    await RoomCache.invalidateRoom(roomId);
    await RoomCache.invalidateRoomsList();

    return getRoomById(roomId);
}

/**
 * Get rooms owned by a user
 */
export async function getUserRooms(userId: string): Promise<RoomWithParticipants[]> {
    const userRooms = await db
        .select({
            id: rooms.id,
            name: rooms.name,
            slug: rooms.slug,
            ownerId: rooms.ownerId,
            topic: rooms.topic,
            languages: rooms.languages,
            maxParticipants: rooms.maxParticipants,
            isActive: rooms.isActive,
            createdAt: rooms.createdAt,
            closedAt: rooms.closedAt,
            ownerUsername: users.username,
            ownerDisplayName: users.displayName,
            ownerAvatarUrl: users.avatarUrl,
        })
        .from(rooms)
        .innerJoin(users, eq(rooms.ownerId, users.id))
        .where(eq(rooms.ownerId, userId))
        .orderBy(desc(rooms.createdAt));

    // Get participant counts
    const roomIds = userRooms.map(r => r.id);

    const participantCounts = roomIds.length > 0
        ? await db
            .select({
                roomId: roomParticipants.roomId,
                count: count(),
            })
            .from(roomParticipants)
            .where(
                and(
                    sql`${roomParticipants.roomId} IN ${roomIds}`,
                    isNull(roomParticipants.leftAt)
                )
            )
            .groupBy(roomParticipants.roomId)
        : [];

    const countMap = new Map(participantCounts.map(pc => [pc.roomId, Number(pc.count)]));

    return userRooms.map(room => ({
        id: room.id,
        name: room.name,
        slug: room.slug,
        ownerId: room.ownerId,
        topic: room.topic,
        languages: room.languages,
        maxParticipants: room.maxParticipants,
        isActive: room.isActive,
        createdAt: room.createdAt,
        closedAt: room.closedAt,
        participantCount: countMap.get(room.id) || 0,
        owner: {
            id: room.ownerId,
            username: room.ownerUsername,
            displayName: room.ownerDisplayName,
            avatarUrl: room.ownerAvatarUrl,
        },
    }));
}

/**
 * Get current room for a user (if they're in one)
 */
export async function getUserCurrentRoom(userId: string): Promise<RoomWithParticipants | null> {
    const participation = await db.query.roomParticipants.findFirst({
        where: and(
            eq(roomParticipants.userId, userId),
            isNull(roomParticipants.leftAt)
        ),
    });

    if (!participation) {
        return null;
    }

    return getRoomById(participation.roomId);
}
