import { Router } from 'express';
import {
    getUserProfile,
    listUsers,
    updateUserProfile,
    deleteUser
} from '../controllers/user.controller';

export const userRouter = Router();

// List all users (public info)
userRouter.get('/', listUsers);

// Get user profile by ID
userRouter.get('/:id', getUserProfile);

// Update user profile (self only)
userRouter.put('/:id', updateUserProfile);

// Delete user (self only)
userRouter.delete('/:id', deleteUser);
