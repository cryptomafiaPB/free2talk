import { Router } from 'express';

export const roomRouter = Router();

// TODO: Implement room routes
// GET /rooms - List active rooms
// POST /rooms - Create room
// GET /rooms/:id - Get room details
// POST /rooms/:id/join - Join room
// POST /rooms/:id/leave - Leave room
// DELETE /rooms/:id - Close room
// POST /rooms/:id/kick/:userId - Kick user
// POST /rooms/:id/transfer/:userId - Transfer ownership

roomRouter.get('/', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

roomRouter.post('/', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

roomRouter.get('/:id', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
