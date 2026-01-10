import type { Request, Response, NextFunction } from 'express';
import { TokenPayload, verifyAccessToken } from '../utils/JWT';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header or cookies
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const payload = verifyAccessToken(token);

        // Attach user to request
        req.user = payload;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};