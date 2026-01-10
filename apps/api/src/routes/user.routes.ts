import { Router } from 'express';

export const userRouter = Router();

// TODO: Implement user routes
// GET /users/:id - Get user profile

userRouter.get('/:id', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
