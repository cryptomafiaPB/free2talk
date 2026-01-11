import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './app-error';


export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

// Generate access token (short-lived: 15min)
export const generateAccessToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: '1h',
        issuer: 'chess-platform'
    };
    return jwt.sign(payload, config.jwtSecret as Secret, options);
};
// Generate refresh token (long-lived: 7 days)
export const generateRefreshToken = (payload: TokenPayload): string => {
    const options: SignOptions = {
        expiresIn: '7d',
        issuer: 'chess-platform'
    };
    return jwt.sign(payload, config.jwtSecret as Secret, options);
};

// Generate both tokens
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload)
    };
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
        throw new AppError('Invalid or expired access token');
    }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
        throw new AppError('Invalid or expired refresh token');
    }
};