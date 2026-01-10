import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { roomRouter } from './routes/room.routes.js';
import { voiceRouter } from './routes/voice.routes.js';
import cookieParser from 'cookie-parser';
import { apiRateLimiter } from './middleware/rate-limiter.middleware.js';

export const app = express();

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser())
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/voice', voiceRouter);

// Error handler
app.use(errorHandler);
