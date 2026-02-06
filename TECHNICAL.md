# Free2Talk - Technical Documentation

> **Comprehensive technical guide for developers, architects, and contributors**

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Feature Deep Dive](#feature-deep-dive)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [WebRTC & Voice Infrastructure](#webrtc--voice-infrastructure)
8. [State Management](#state-management)
9. [Authentication & Security](#authentication--security)
10. [Real-Time Communication](#real-time-communication)
11. [Performance & Scalability](#performance--scalability)
12. [Development Workflow](#development-workflow)
13. [Deployment](#deployment)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is Free2Talk?

Free2Talk is a **real-time voice communication platform** for language learners, built with modern web technologies and enterprise-grade WebRTC infrastructure. The platform enables users to practice languages through:

1. **Voice Rooms** - Multi-user voice chat rooms (2-12 participants)
2. **Random Matching** - One-click pairing with language partners

### Key Design Principles

- **Scalability** - Built to handle thousands of concurrent users
- **Type Safety** - Full TypeScript coverage across frontend and backend
- **Real-Time** - WebSocket-based communication for instant updates
- **Modular** - Clean separation of concerns with monorepo structure
- **Production-Ready** - Industry-standard architecture and best practices

---

## Architecture

### High-Level Architecture

![alt text](image.png)
<!-- ```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (Port 3000)                            │  │
│  │  - React Components                                      │  │
│  │  - Zustand State Management                              │  │
│  │  - TanStack Query (Data Fetching)                        │  │
│  │  - Socket.io Client                                      │  │
│  │  - mediasoup-client (WebRTC)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (Port 3001)                           │  │
│  │  - REST API Routes                                       │  │
│  │  - Socket.io Server                                      │  │
│  │  - Authentication Middleware                             │  │
│  │  - Rate Limiting                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────┬──────────────────────┬────┘
         │                            │                      │
         ↓                            ↓                      ↓
┌─────────────────┐     ┌──────────────────────┐   ┌────────────────┐
│  PostgreSQL     │     │  Redis               │   │  mediasoup     │
│  (Primary DB)   │     │  (Cache & Sessions)  │   │  (WebRTC SFU)  │
│  - User Data    │     │  - Rate Limiting     │   │  - Voice       │
│  - Rooms        │     │  - Active Sessions   │   │  - Transports  │
│  - Messages     │     │  - Queue Management  │   │  - Producers   │
└─────────────────┘     └──────────────────────┘   │  - Consumers   │
                                                    └────────────────┘
``` -->

### Monorepo Structure

Free2Talk uses a **Turborepo-based monorepo** for efficient development:

```
free2talk/
├── apps/
│   ├── api/          # Backend (Express + Socket.io + mediasoup)
│   └── web/          # Frontend (Next.js)
├── packages/
│   └── shared/       # Shared types, constants, validation schemas
├── turbo.json        # Build orchestration
└── pnpm-workspace.yaml
```

**Benefits:**
- Shared TypeScript types between frontend and backend
- Atomic commits across the entire stack
- Optimized builds with Turborepo caching
- Simplified dependency management with pnpm workspaces

---

## Technology Stack

### Frontend Technologies

#### **Next.js 16 (App Router)**
- **Why?** Server-side rendering, optimal performance, modern React features
- **Features Used:**
  - App Router for file-based routing
  - Server Components for optimized loading
  - API routes (minimal usage, prefer backend API)
  - Middleware for client-side auth checks

#### **TypeScript 5.0+**
- **Why?** Type safety, better DX, fewer runtime errors
- **Configuration:**
  - Strict mode enabled
  - Path aliases (`@/components`, `@/lib`)
  - Shared types from `@free2talk/shared` package

#### **Tailwind CSS 4**
- **Why?** Utility-first, fast development, small bundle size
- **Customization:**
  - Custom color palette
  - Extended spacing scale
  - Animation utilities via `tw-animate-css`

#### **shadcn/ui**
- **Why?** Copy-paste components, full customization, accessibility
- **Components Used:**
  - Dialog, Avatar, Dropdown, Tooltip
  - Scroll Area, Separator, Tabs
  - All components in `apps/web/components/ui/`

#### **Zustand**
- **Why?** Minimal boilerplate, TypeScript-friendly, no context providers
- **Stores:**
  - `useAuthStore` - User authentication state
  - `useRoomStore` - Voice room state
  - `useVoiceStore` - WebRTC connection state
  - `useRandomStore` - Random matching state

#### **TanStack Query (React Query)**
- **Why?** Server state management, caching, automatic refetching
- **Usage:**
  - Fetching rooms list
  - User profile data
  - Optimistic updates
  - Stale-while-revalidate pattern

#### **Socket.io Client**
- **Why?** WebSocket abstraction, auto-reconnection, fallback transports
- **Features:**
  - Room-based messaging
  - Real-time user presence
  - Voice room events

#### **mediasoup-client**
- **Why?** Production-grade WebRTC, SFU architecture, excellent performance
- **Usage:**
  - Connecting to mediasoup server
  - Sending/receiving audio tracks
  - Device capabilities detection

---

### Backend Technologies

#### **Express.js**
- **Why?** Minimal, flexible, huge ecosystem
- **Middleware Stack:**
  1. `helmet` - Security headers
  2. `cors` - Cross-origin requests
  3. `morgan` - HTTP logging
  4. `cookie-parser` - Cookie handling
  5. `express-rate-limit` - Rate limiting
  6. Custom auth middleware
  7. Error handling middleware

#### **Socket.io**
- **Why?** Real-time bi-directional communication
- **Namespaces:**
  - `/` - Default namespace for general events
  - Custom rooms via Socket.io rooms feature
- **Events:**
  - Authentication on connection
  - Room join/leave
  - Random matching queue
  - Voice room updates

#### **mediasoup 3**
- **Why?** Industry-standard WebRTC SFU, used by Google Meet, Discord
- **Architecture:**
  - **Workers** - CPU-bound processes for media handling
  - **Routers** - Media routing per room
  - **Transports** - WebRTC connections (one per client per direction)
  - **Producers** - Outgoing media streams
  - **Consumers** - Incoming media streams

**mediasoup Flow:**

![alt text](image-1.png)

<!-- ```
Client A                    mediasoup Server                Client B
   │                              │                            │
   ├─────── Create Transport ────→│                            │
   │←────── Transport Params ─────┤                            │
   │                              │                            │
   ├─────── Produce Audio ───────→│                            │
   │                              ├────── Consume Audio ──────→│
   │                              │←───── Consumer Params ─────┤
   │                              │                            │
   │◄──────── Audio Packets ──────┼──────── Audio Packets ────→│
``` -->

#### **PostgreSQL with Drizzle ORM**
- **Why PostgreSQL?**
  - ACID compliance
  - JSON support
  - Full-text search
  - Robust and battle-tested

- **Why Drizzle ORM?**
  - Type-safe SQL queries
  - No bloat, minimal abstraction
  - Excellent TypeScript inference
  - Migration support

**Drizzle Schema Example:**
```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### **Redis**
- **Why?** In-memory speed, pub/sub, excellent for sessions
- **Use Cases:**
  1. **Rate Limiting** - Track API request counts
  2. **Session Storage** - Active user sessions
  3. **Queue Management** - Random matching queue
  4. **Caching** - Frequently accessed data (room lists)
  5. **Pub/Sub** - Cross-server communication (future horizontal scaling)

**Redis Data Structures:**
```javascript
// Rate limiting
rate_limit:user:123 = { count: 10, ttl: 60 }

// Random matching queue
random_queue:en:fr = ['user:456', 'user:789']

// Active room participants
room:42:participants = Set['user:123', 'user:456']
```

#### **JWT (JSON Web Tokens)**
- **Why?** Stateless authentication, scalable
- **Implementation:**
  - Access token in HTTP-only cookie (15 minutes expiry)
  - Refresh token in HTTP-only cookie (7 days expiry)
  - Token rotation on refresh
  - Secure flag in production

#### **Cloudinary**
- **Why?** Cloud-based image storage, transformations, CDN
- **Usage:**
  - User avatar uploads
  - Automatic image optimization
  - Responsive image URLs

---

### DevOps & Tools

#### **Turborepo**
- **Why?** Monorepo build orchestration, intelligent caching
- **Configuration** (`turbo.json`):
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

#### **pnpm**
- **Why?** Fast, disk-efficient, strict node_modules
- **Workspaces:**
  - Shared dependencies hoisted
  - Per-package dependencies isolated

#### **Docker & Docker Compose**
- **Development Stack** (`docker-compose.yml`):
  - PostgreSQL (port 5432)
  - Redis (port 6379)
- **Production Stack** (`docker-compose.prod.yml`):
  - Multi-stage builds
  - Health checks
  - Volume management

#### **TypeScript**
- **Strict Mode Enabled**
- **Shared Configuration:**
  - Base tsconfig in root
  - Extended by each package
  - Path aliases for imports

---

## Feature Deep Dive

### 1. Voice Rooms

#### Overview
Voice rooms allow 2-12 users to have real-time voice conversations. Room owners have moderation controls.

#### User Flow
```
1. User clicks "Create Room"
2. Sets room settings (name, max users, language, topic)
3. Room created in database
4. mediasoup Router created
5. User joins as owner
6. Other users can join
7. Audio streams via WebRTC
8. Owner can mute/kick users
9. Owner can close room or transfer ownership
```

#### Technical Implementation

**Database Schema:**
```typescript
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  ownerId: integer('owner_id').references(() => users.id),
  maxUsers: integer('max_users').default(12),
  currentUsers: integer('current_users').default(0),
  languages: text('languages').array(),
  topic: varchar('topic', { length: 200 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Backend API Endpoints:**
- `POST /api/v1/rooms` - Create room
- `GET /api/v1/rooms` - List active rooms
- `GET /api/v1/rooms/:id` - Get room details
- `PATCH /api/v1/rooms/:id` - Update room settings
- `DELETE /api/v1/rooms/:id` - Close room

**Socket.io Events:**
- `room:join` - User joins room
- `room:leave` - User leaves room
- `room:user-joined` - Broadcast to room
- `room:user-left` - Broadcast to room
- `room:settings-updated` - Room settings changed
- `room:closed` - Room closed by owner

**mediasoup Integration:**
```typescript
// Create router for room
const router = await worker.createRouter({
  mediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
  ],
});

// Store router reference
roomRouters.set(roomId, router);

// Create transport for each user
const transport = await router.createWebRtcTransport({
  listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
});

// User produces audio
const producer = await transport.produce({
  kind: 'audio',
  rtpParameters,
});

// Other users consume audio
for (const otherUser of roomUsers) {
  const consumer = await otherUser.transport.consume({
    producerId: producer.id,
    rtpCapabilities: otherUser.rtpCapabilities,
  });
}
```

**Frontend State Management:**
```typescript
interface RoomState {
  currentRoom: Room | null;
  participants: User[];
  isMuted: boolean;
  isConnecting: boolean;
  
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
  kickUser: (userId: string) => void;
}

const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  participants: [],
  isMuted: false,
  isConnecting: false,
  
  joinRoom: async (roomId) => {
    set({ isConnecting: true });
    // Socket.io join
    // mediasoup connection
    // Update state
  },
  // ... other actions
}));
```

---

### 2. Random Matching

#### Overview
Random matching connects two users instantly for one-on-one voice conversations.

#### Algorithm
```typescript
// Queue Management (Redis-based)
class RandomMatchingQueue {
  async addUser(userId: string, preferences: { 
    languages: string[] 
  }): Promise<Match | null> {
    const queueKey = `random_queue:${preferences.languages.join(':')}`;
    
    // Check if someone is waiting
    const waitingUser = await redis.lpop(queueKey);
    
    if (waitingUser) {
      // Match found!
      return {
        user1: userId,
        user2: waitingUser,
        matchedAt: Date.now(),
      };
    } else {
      // Add to queue
      await redis.rpush(queueKey, userId);
      // Set timeout (remove after 2 minutes)
      await redis.expire(queueKey, 120);
      return null;
    }
  }
  
  async removeUser(userId: string): Promise<void> {
    // Remove from all queues
    const pattern = 'random_queue:*';
    const queues = await redis.keys(pattern);
    
    for (const queue of queues) {
      await redis.lrem(queue, 0, userId);
    }
  }
}
```

#### Matching Flow
```
1. User clicks "Find Random Partner"
2. User preferences sent to server (languages)
3. Server checks Redis queue for matching user
4. If match found:
   a. Create temporary room
   b. Connect both users via mediasoup
   c. Start voice call
5. If no match:
   a. Add user to queue
   b. Poll server every 2 seconds
   c. Timeout after 2 minutes
```

#### Socket.io Events
- `random:start-search` - User starts searching
- `random:cancel-search` - User cancels
- `random:match-found` - Match found, connect
- `random:call-ended` - Call ended by either user
- `random:timeout` - No match found in 2 minutes

#### Database Schema
```typescript
export const callHistory = pgTable('call_history', {
  id: serial('id').primaryKey(),
  user1Id: integer('user1_id').references(() => users.id),
  user2Id: integer('user2_id').references(() => users.id),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // seconds
});
```

---

### 3. Authentication System

#### Strategy
- **Primary:** JWT with HTTP-only cookies
- **Secondary:** Google OAuth 2.0

#### JWT Implementation

**Token Generation:**
```typescript
import jwt from 'jsonwebtoken';

const generateAccessToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
};
```

**Setting Cookies:**
```typescript
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

**Auth Middleware:**
```typescript
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Attach user to request
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Token Refresh Flow:**
```
1. Access token expires (15 min)
2. Client receives 401 error
3. Client sends refresh token
4. Server validates refresh token
5. Server issues new access token
6. Server issues new refresh token (rotation)
7. Old refresh token invalidated
```

#### Google OAuth

**Backend Setup:**
```typescript
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export const googleAuthController = async (req: Request, res: Response) => {
  const { credential } = req.body;
  
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload!;
    
    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email!),
    });
    
    if (!user) {
      [user] = await db.insert(users).values({
        email: email!,
        username: email!.split('@')[0],
        displayName: name,
        avatarUrl: picture,
        googleId: payload!.sub,
      }).returning();
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Set cookies
    // ...
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
};
```

**Frontend Integration:**
```typescript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    const response = await fetch('/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: credentialResponse.credential }),
    });
    
    const data = await response.json();
    // Update auth state
  };
  
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <GoogleLogin onSuccess={handleGoogleSuccess} />
    </GoogleOAuthProvider>
  );
}
```

---

### 4. Profile Management

#### Features
- Update display name, bio, languages
- Upload avatar (Cloudinary)
- View profile statistics
- Privacy settings

#### Cloudinary Integration

**Backend Upload Handler:**
```typescript
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

export const uploadAvatar = async (req: Request, res: Response) => {
  const file = req.file;
  
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'free2talk/avatars',
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    uploadStream.end(file.buffer);
  });
  
  // Update user avatar URL
  await db.update(users)
    .set({ avatarUrl: result.secure_url })
    .where(eq(users.id, req.user.id));
  
  res.json({ avatarUrl: result.secure_url });
};
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     users       │         │     rooms       │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │    ┌───→│ id (PK)         │
│ email           │    │    │ name            │
│ username        │    │    │ owner_id (FK)   │───┐
│ display_name    │    │    │ max_users       │   │
│ avatar_url      │    │    │ current_users   │   │
│ google_id       │    │    │ languages[]     │   │
│ created_at      │    │    │ topic           │   │
└────────┬────────┘    │    │ is_active       │   │
         │             │    │ created_at      │   │
         │             │    └─────────────────┘   │
         │             │                          │
         │             └──────────────────────────┘
         │
         │
         │     ┌─────────────────┐
         ├────→│  call_history   │
         │     ├─────────────────┤
         │     │ id (PK)         │
         ├────→│ user1_id (FK)   │
         ├────→│ user2_id (FK)   │
         │     │ started_at      │
         │     │ ended_at        │
         │     │ duration        │
         │     └─────────────────┘
         │
         │     ┌─────────────────┐
         └────→│    profiles     │
               ├─────────────────┤
               │ user_id (FK/PK) │
               │ bio             │
               │ languages[]     │
               │ interests[]     │
               │ privacy_level   │
               └─────────────────┘
```

### Schema Details

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- nullable for OAuth users
  display_name VARCHAR(100),
  avatar_url TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  max_users INTEGER DEFAULT 12,
  current_users INTEGER DEFAULT 0,
  languages TEXT[],
  topic VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_active ON rooms(is_active);
CREATE INDEX idx_rooms_languages ON rooms USING GIN(languages);
```

#### Call History Table
```sql
CREATE TABLE call_history (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER, -- in seconds
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_call_history_user1 ON call_history(user1_id);
CREATE INDEX idx_call_history_user2 ON call_history(user2_id);
CREATE INDEX idx_call_history_started ON call_history(started_at DESC);
```

---

## API Documentation

### Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.free2talk.com/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "displayName": "John Doe"
}

Response 201:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe"
  },
  "message": "Registration successful"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### Google OAuth
```http
POST /auth/google
Content-Type: application/json

{
  "credential": "google_id_token_here"
}

Response 200:
{
  "user": { ... }
}
```

#### Logout
```http
POST /auth/logout

Response 200:
{
  "message": "Logged out successfully"
}
```

#### Refresh Token
```http
POST /auth/refresh

Response 200:
{
  "message": "Token refreshed"
}
```

---

### Room Endpoints

#### Create Room
```http
POST /rooms
Authorization: Required
Content-Type: application/json

{
  "name": "Spanish Practice Room",
  "maxUsers": 8,
  "languages": ["es", "en"],
  "topic": "Daily conversations"
}

Response 201:
{
  "room": {
    "id": 42,
    "name": "Spanish Practice Room",
    "ownerId": 1,
    "maxUsers": 8,
    "currentUsers": 0,
    "languages": ["es", "en"],
    "topic": "Daily conversations",
    "isActive": true,
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

#### List Rooms
```http
GET /rooms?page=1&limit=20&language=es

Response 200:
{
  "rooms": [
    {
      "id": 42,
      "name": "Spanish Practice Room",
      "currentUsers": 3,
      "maxUsers": 8,
      "languages": ["es", "en"],
      "owner": {
        "id": 1,
        "username": "johndoe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### Get Room
```http
GET /rooms/:id

Response 200:
{
  "room": { ... },
  "participants": [
    {
      "id": 1,
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "..."
    }
  ]
}
```

#### Update Room
```http
PATCH /rooms/:id
Authorization: Required (Owner only)
Content-Type: application/json

{
  "maxUsers": 10
}

Response 200:
{
  "room": { ... }
}
```

#### Delete Room
```http
DELETE /rooms/:id
Authorization: Required (Owner only)

Response 204
```

---

### User Endpoints

#### Get Profile
```http
GET /users/me
Authorization: Required

Response 200:
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "...",
    "stats": {
      "totalCalls": 42,
      "totalMinutes": 360
    }
  }
}
```

#### Update Profile
```http
PATCH /users/me
Authorization: Required
Content-Type: application/json

{
  "displayName": "John Smith",
  "bio": "Language enthusiast"
}

Response 200:
{
  "user": { ... }
}
```

#### Upload Avatar
```http
POST /upload/avatar
Authorization: Required
Content-Type: multipart/form-data

file: [image file]

Response 200:
{
  "avatarUrl": "https://res.cloudinary.com/..."
}
```

---

### Voice Endpoints

#### Get Router RTP Capabilities
```http
GET /voice/router-capabilities/:roomId
Authorization: Required

Response 200:
{
  "rtpCapabilities": { ... }
}
```

#### Create WebRTC Transport
```http
POST /voice/create-transport
Authorization: Required
Content-Type: application/json

{
  "roomId": 42,
  "direction": "send" // or "recv"
}

Response 200:
{
  "transportId": "...",
  "iceParameters": { ... },
  "iceCandidates": [ ... ],
  "dtlsParameters": { ... }
}
```

---

## WebRTC & Voice Infrastructure

### mediasoup Architecture

#### Components

1. **Workers**
   - CPU-bound processes
   - Handle media encoding/decoding
   - Typically one per CPU core

2. **Routers**
   - One per voice room
   - Route media between transports
   - Handle codec negotiation

3. **Transports**
   - WebRTC connection per user per direction
   - Send transport for outgoing media
   - Receive transport for incoming media

4. **Producers**
   - Outgoing media streams from user
   - Audio track from microphone

5. **Consumers**
   - Incoming media streams to user
   - Audio tracks from other participants

#### Initialization

```typescript
import * as mediasoup from 'mediasoup';

// Create workers (one per CPU core)
const workers: mediasoup.types.Worker[] = [];

for (let i = 0; i < os.cpus().length; i++) {
  const worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });
  
  workers.push(worker);
}

// Round-robin worker selection
let workerIdx = 0;
const getNextWorker = (): mediasoup.types.Worker => {
  const worker = workers[workerIdx];
  workerIdx = (workerIdx + 1) % workers.length;
  return worker;
};
```

#### Room Creation

```typescript
const createRoomRouter = async (roomId: string) => {
  const worker = getNextWorker();
  
  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
    ],
  });
  
  roomRouters.set(roomId, router);
  return router;
};
```

#### Transport Creation

```typescript
const createWebRtcTransport = async (
  router: mediasoup.types.Router
): Promise<mediasoup.types.WebRtcTransport> => {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP, // Public IP
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1000000,
  });
  
  return transport;
};
```

#### Client Connection Flow

```typescript
// Frontend
const device = new mediasoupClient.Device();

// 1. Load device with router capabilities
const rtpCapabilities = await fetch('/voice/router-capabilities/42').then(r => r.json());
await device.load({ routerRtpCapabilities: rtpCapabilities });

// 2. Create send transport
const sendTransportData = await fetch('/voice/create-transport', {
  method: 'POST',
  body: JSON.stringify({ roomId: 42, direction: 'send' }),
}).then(r => r.json());

const sendTransport = device.createSendTransport(sendTransportData);

// 3. Handle 'connect' event
sendTransport.on('connect', async ({ dtlsParameters }, callback) => {
  await fetch('/voice/connect-transport', {
    method: 'POST',
    body: JSON.stringify({ transportId: sendTransport.id, dtlsParameters }),
  });
  callback();
});

// 4. Handle 'produce' event
sendTransport.on('produce', async ({ kind, rtpParameters }, callback) => {
  const { id } = await fetch('/voice/produce', {
    method: 'POST',
    body: JSON.stringify({ transportId: sendTransport.id, kind, rtpParameters }),
  }).then(r => r.json());
  
  callback({ id });
});

// 5. Produce audio track
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioTrack = stream.getAudioTracks()[0];
const audioProducer = await sendTransport.produce({ track: audioTrack });

// 6. Create receive transport and consume other users
// Similar flow for receiving audio
```

---

## State Management

### Zustand Stores

#### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ user: response.data.user, isAuthenticated: true });
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    try {
      const response = await api.get('/users/me');
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

#### Room Store
```typescript
interface RoomState {
  currentRoom: Room | null;
  participants: Participant[];
  isMuted: boolean;
  
  // mediasoup objects
  device: mediasoupClient.Device | null;
  sendTransport: mediasoupClient.types.Transport | null;
  recvTransport: mediasoupClient.types.Transport | null;
  audioProducer: mediasoupClient.types.Producer | null;
  consumers: Map<string, mediasoupClient.types.Consumer>;
  
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
}
```

---

## Real-Time Communication

### Socket.io Events

#### Client → Server

```typescript
// Join room
socket.emit('room:join', { roomId: 42 });

// Leave room
socket.emit('room:leave', { roomId: 42 });

// Start random search
socket.emit('random:start-search', { 
  languages: ['es', 'en'] 
});

// Cancel random search
socket.emit('random:cancel-search');

// End random call
socket.emit('random:call-ended');
```

#### Server → Client

```typescript
// Room events
socket.on('room:user-joined', (data: { user: User }) => {
  console.log(`${data.user.username} joined`);
});

socket.on('room:user-left', (data: { userId: number }) => {
  console.log(`User ${data.userId} left`);
});

socket.on('room:closed', () => {
  alert('Room closed by owner');
});

// Random matching events
socket.on('random:match-found', (data: { partner: User, roomId: string }) => {
  console.log('Match found!', data.partner);
});

socket.on('random:timeout', () => {
  console.log('No match found');
});
```

---

## Performance & Scalability

### Current Capacity

With single-server setup:
- **Concurrent rooms:** ~100 rooms
- **Users per room:** Up to 12
- **Total concurrent users:** ~500-1000

### Optimization Strategies

#### 1. Redis Caching
```typescript
// Cache room list (60 second TTL)
const getRooms = async () => {
  const cached = await redis.get('rooms:active');
  if (cached) return JSON.parse(cached);
  
  const rooms = await db.query.rooms.findMany({
    where: eq(rooms.isActive, true),
  });
  
  await redis.setex('rooms:active', 60, JSON.stringify(rooms));
  return rooms;
};
```

#### 2. Database Indexing
- Indexed columns: `users.email`, `rooms.is_active`, `rooms.languages`
- Composite indexes for common queries

#### 3. CDN for Static Assets
- Cloudinary for user-uploaded images
- CDN for Next.js static files

#### 4. Connection Pooling
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Horizontal Scaling (Future)

To scale beyond single server:

1. **Multiple API Servers**
   - Load balancer (nginx/HAProxy)
   - Sticky sessions for Socket.io
   - Redis pub/sub for cross-server events

2. **Separate mediasoup Servers**
   - Dedicated media servers
   - API servers route to media servers
   - Geographic distribution

3. **Database Replication**
   - Primary-replica PostgreSQL setup
   - Read replicas for queries
   - Write to primary only

---

## Development Workflow

### Local Setup

```bash
# Install dependencies
pnpm install

# Start databases
docker-compose up -d

# Initialize database
pnpm db:push

# Start dev servers
pnpm dev
```

### Environment Variables

#### Backend (`apps/api/.env`)
```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://free2talk:password@localhost:5432/free2talk

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# mediasoup
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
MEDIASOUP_MIN_PORT=10000
MEDIASOUP_MAX_PORT=10100
```

#### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Code Style

- **ESLint** for linting
- **Prettier** for formatting
- **Husky** for pre-commit hooks (future)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/new-feature

# Open Pull Request on GitHub
```

---

## Deployment

### Production Build

```bash
# Build all apps
pnpm build

# Start production servers
pnpm start
```

### Docker Production

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure production database
- [ ] Set CORS allowed origins
- [ ] Enable HTTPS
- [ ] Set secure cookies
- [ ] Configure mediasoup announced IP (public IP)
- [ ] Set up CDN
- [ ] Configure monitoring

<!-- ### Monitoring

Recommended tools:
- **Application:** Sentry for error tracking
- **Performance:** New Relic or Datadog
- **Uptime:** UptimeRobot
- **Logs:** ELK stack or CloudWatch -->

---


## Troubleshooting

### Common Issues

#### WebRTC Connection Fails

**Symptom:** Users can't hear each other

**Solutions:**
1. Check mediasoup announced IP is set correctly
2. Ensure UDP ports 10000-10100 are open
3. Check browser WebRTC permissions
4. Test with TURN server if behind NAT

#### Socket.io Disconnects

**Symptom:** Frequent disconnections

**Solutions:**
1. Increase timeout values
2. Enable sticky sessions if using multiple servers
3. Check for CORS issues
4. Verify WebSocket support

#### Database Connection Pool Exhausted

**Symptom:** "Too many connections" errors

**Solutions:**
1. Increase pool size
2. Check for connection leaks
3. Implement connection timeout
4. Use connection pooler (PgBouncer)

---

## Security Best Practices

1. **Authentication**
   - HTTP-only cookies for tokens
   - Secure flag in production
   - SameSite=strict
   - Token rotation

2. **API Security**
   - Rate limiting (100 req/15min per IP)
   - CORS whitelist
   - Helmet.js security headers
   - Input validation with Zod

3. **Database**
   - Parameterized queries (Drizzle ORM)
   - Connection encryption (SSL)
   - Least privilege principle

4. **WebRTC**
   - DTLS encryption (enabled by default)
   - Media encryption (SRTP)
   - No media recording by default

---

## Contributing to Documentation

Found an error or want to improve this documentation?

1. Open an issue on GitHub
2. Submit a pull request
3. Join our [Telegram developer group](https://t.me/+SXrT3SraB9piMmVl)

---

## Additional Resources

- **[mediasoup Documentation](https://mediasoup.org/documentation/v3/)**
- **[Next.js Documentation](https://nextjs.org/docs)**
- **[Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)**
- **[Socket.io Documentation](https://socket.io/docs/v4/)**

---

<div align="center">

**Last Updated:** February 2026

**Maintainers:** Free2Talk Core Team

[Back to README](./README.md) • [Contributing](./CONTRIBUTING.md) • [License](./LICENSE)

</div>
