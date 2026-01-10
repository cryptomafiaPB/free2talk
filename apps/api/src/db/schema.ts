import { pgTable, uuid, varchar, text, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roomParticipantRole = pgEnum('room_participant_role', ['owner', 'participant']);

// Users Table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    username: varchar('username', { length: 50 }).unique().notNull(),
    displayName: varchar('display_name', { length: 100 }),
    avatarUrl: text('avatar_url'),
    passwordHash: text('password_hash').notNull(),
    bio: text('bio'),
    nativeLanguages: text('native_languages').array().default([]),
    learningLanguages: text('learning_languages').array().default([]),
    isOnline: boolean('is_online').default(false),
    lastSeenAt: timestamp('last_seen_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rooms Table
export const rooms = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).unique(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(),
    topic: varchar('topic', { length: 200 }),
    languages: text('languages').array().default([]),
    maxParticipants: integer('max_participants').default(12).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
});

// Room Participants Table
export const roomParticipants = pgTable('room_participants', {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    role: roomParticipantRole('role').default('participant').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
});

// Refresh Tokens Table
export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    token: text('token').unique().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    ownedRooms: many(rooms),
    roomParticipations: many(roomParticipants),
    refreshTokens: many(refreshTokens, { relationName: 'refreshTokens' }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, {
        fields: [refreshTokens.userId],
        references: [users.id],
        relationName: 'refreshTokens',
    }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
    owner: one(users, {
        fields: [rooms.ownerId],
        references: [users.id],
    }),
    participants: many(roomParticipants),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
    room: one(rooms, {
        fields: [roomParticipants.roomId],
        references: [rooms.id],
    }),
    user: one(users, {
        fields: [roomParticipants.userId],
        references: [users.id],
    }),
}));
