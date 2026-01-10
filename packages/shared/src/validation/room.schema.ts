import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z
        .string()
        .min(3, 'Room name must be at least 3 characters')
        .max(100, 'Room name must be less than 100 characters'),
    topic: z.string().max(200, 'Topic must be less than 200 characters').optional(),
    languages: z
        .array(z.string())
        .min(1, 'At least one language is required')
        .max(5, 'Maximum 5 languages allowed'),
    maxParticipants: z
        .number()
        .int()
        .min(2, 'Minimum 2 participants')
        .max(12, 'Maximum 12 participants')
        .default(12),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
