import { Router } from 'express';

export const authRouter = Router();

// TODO: Implement auth routes
// POST /register
// POST /login
// POST /logout
// POST /refresh
// GET /me

authRouter.post('/register', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

authRouter.post('/login', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

authRouter.post('/logout', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

authRouter.post('/refresh', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});

authRouter.get('/me', (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
