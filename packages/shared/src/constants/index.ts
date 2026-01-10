export const LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Dutch',
    'Polish',
    'Turkish',
    'Vietnamese',
    'Thai',
    'Swedish',
    'Greek',
    'Czech',
    'Marathi',
    'Bengali',
    'Urdu',
    'Indonesian',
    'Tamil',
    'Filipino',
    'Nepali',
    'Malayalam',
    'Punjabi',
    'Gujarati',
] as const;

export const MAX_ROOM_PARTICIPANTS = 12;
export const MIN_ROOM_PARTICIPANTS = 2;

export const JWT_ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
export const JWT_REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

export const API_RATE_LIMITS = {
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window
    },
    api: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 requests per window
    },
    voice: {
        windowMs: 60 * 1000, // 1 minute
        max: 50, // 50 requests per window
    },
};
