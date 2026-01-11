import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiry: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    mediasoup: {
        workers: parseInt(process.env.MEDIASOUP_WORKERS || '3'),
        listenIp: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
        rtcMinPort: parseInt(process.env.MEDIASOUP_RTC_MIN_PORT || '10000'),
        rtcMaxPort: parseInt(process.env.MEDIASOUP_RTC_MAX_PORT || '10100'),
    },
};