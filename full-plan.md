# Free2Talk - Complete Platform Plan

> A free, scalable language learning voice communication platform where users practice languages with native speakers and language partners.

**Last Updated:** January 10, 2026

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [Voice Infrastructure](#voice-infrastructure)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Frontend Architecture](#frontend-architecture)
8. [Security & Authentication](#security--authentication)
9. [Deployment Strategy](#deployment-strategy)
10. [Phase Breakdown](#phase-breakdown)

---

## Platform Overview

### Vision
Free2Talk is a free language learning platform that connects users globally through voice communication. Unlike existing platforms, it offers two distinct ways to connect:

1. **Voice Rooms** - Topic-based group conversations (2-12 users)
2. **Random Partner Matching** - Instant 1:1 connections for spontaneous practice

### Monetization
- **Free tier**: Full access to all core features
- **Premium (Donations)**: Cosmetic upgrades (icons, themes), priority support, badges

### Differentiators
- Dual connection modes (rooms + random matching)
- Full social features (profiles, followers, friends, DMs)
- Self-hosted, cost-efficient voice infrastructure
- No vendor lock-in

---

## Core Features

### Phase 1 (MVP)
| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password with JWT + refresh tokens |
| **User Profiles** | Basic profile with languages, bio, avatar |
| **Hallway (Room List)** | Browse and search active voice rooms |
| **Create Room** | Set name, topic, languages, max participants (2-12) |
| **Join Room** | Enter room with voice, see participants |
| **Voice Chat (SFU)** | Real-time voice via mediasoup for groups |
| **Room Controls** | Mute self, leave room |
| **Owner Controls** | Kick users, close room, transfer ownership |
| **Ownership Transfer** | Manual transfer or auto-transfer on disconnect |

### Phase 2
| Feature | Description |
|---------|-------------|
| **Random Partner** | 1:1 matching via P2P with SFU fallback |
| **OAuth Login** | Google, Discord, Apple sign-in |
| **Profile Enhancement** | Edit profile, language proficiency levels |
| **Room Search/Filter** | Filter by language, topic, participant count |
| **Text Chat in Rooms** | Optional text alongside voice |

### Phase 3
| Feature | Description |
|---------|-------------|
| **Friends System** | Send/accept friend requests |
| **Direct Messages** | Text DMs with friends |
| **Voice/Video Calls** | 1:1 calls through DMs |
| **Followers/Following** | Social graph for discovering users |
| **Notifications** | Push notifications for friend requests, mentions |

### Phase 4
| Feature | Description |
|---------|-------------|
| **Premium Features** | Custom themes, icons, badges |
| **Room Scheduling** | Schedule rooms for future times |
| **Room Recording** | Opt-in recording for practice review |
| **Language Analytics** | Track practice time, languages, partners |
| **Mobile Apps** | React Native iOS/Android apps |

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+ (App Router) | SSR, file-based routing, React ecosystem |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, accessible components |
| **State Management** | Zustand | Lightweight, TypeScript-friendly |
| **Data Fetching** | TanStack Query | Caching, background updates, optimistic UI |
| **Backend** | Express.js + TypeScript | Flexibility, mediasoup compatibility |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great DX |
| **Database** | PostgreSQL | Relational data, proven scalability |
| **Cache/Sessions** | Redis | Session store, pub/sub, presence |
| **Voice (SFU)** | mediasoup | Full control, cost-efficient, Node.js native |
| **Real-time** | Socket.io | Room events, presence, signaling |
| **Monorepo** | Turborepo | Shared types, efficient builds |

### Project Structure

```
free2talk/
├── apps/
│   ├── web/                      # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── layout.tsx
│   │   │   ├── (main)/
│   │   │   │   ├── hallway/      # Room list
│   │   │   │   ├── room/[id]/    # Voice room
│   │   │   │   ├── profile/[id]/ # User profile
│   │   │   │   └── layout.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Landing
│   │   ├── components/
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── room/             # Voice room components
│   │   │   ├── hallway/          # Room list components
│   │   │   └── layout/           # Header, sidebar, etc.
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useRoom.ts
│   │   │   └── useMediasoup.ts
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   ├── socket.ts         # Socket.io client
│   │   │   └── mediasoup.ts      # mediasoup-client setup
│   │   ├── stores/               # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── roomStore.ts
│   │   │   └── uiStore.ts
│   │   └── types/
│   │
│   └── api/                      # Express backend
│       ├── src/
│       │   ├── index.ts          # Entry point
│       │   ├── app.ts            # Express app setup
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── user.routes.ts
│       │   │   └── room.routes.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── room.service.ts
│       │   │   └── voice.service.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── error.middleware.ts
│       │   │   └── validate.middleware.ts
│       │   ├── socket/
│       │   │   ├── index.ts
│       │   │   ├── handlers/
│       │   │   └── mediasoup/
│       │   │       ├── workers.ts
│       │   │       ├── rooms.ts
│       │   │       └── handlers.ts
│       │   ├── db/
│       │   │   ├── index.ts      # Drizzle client
│       │   │   ├── schema.ts     # All tables
│       │   │   └── migrations/
│       │   └── utils/
│       │       ├── jwt.ts
│       │       └── errors.ts
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared code
│       ├── types/
│       │   ├── user.ts
│       │   ├── room.ts
│       │   └── socket-events.ts
│       ├── validation/
│       │   ├── auth.schema.ts
│       │   └── room.schema.ts
│       └── constants/
│
├── docker-compose.yml            # Local dev (PostgreSQL, Redis)
├── docker-compose.prod.yml       # Production
├── turbo.json
├── package.json
└── README.md
```

---

## Voice Infrastructure

### Architecture Strategy: Hybrid P2P + SFU

| Scenario | Topology | Server Load | Rationale |
|----------|----------|-------------|-----------|
| **1:1 Random Calls** | P2P (Direct) | ~0% | Zero media server cost |
| **1:1 Fallback** | SFU | Low | For symmetric NAT (~10-15% of users) |
| **Rooms (3-12 users)** | SFU | Medium-High | Mesh impossible at scale |

### Why This Approach

```
P2P for 1:1:                    SFU for Groups:
──────────────                  ────────────────
User A ◄────────► User B        User A ──┐
                                User B ──┼──► mediasoup ──► All Users
Server: 0 streams               User C ──┘
                                
                                Server handles routing
```

**Cost Savings**: If 70% of connections are 1:1 P2P, server handles 70% less media traffic.

### mediasoup Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DIGITALOCEAN DROPLET                             │
│                     (4 vCPU, 8GB RAM)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐ │
│  │    Express Server    │    │       mediasoup Workers            │ │
│  │    ──────────────    │    │                                    │ │
│  │    • REST API        │    │  ┌──────────┐ ┌──────────┐ ┌─────┐ │ │
│  │    • Socket.io       │◄──►│  │ Worker 1 │ │ Worker 2 │ │ W3  │ │ │
│  │    • Room Management │    │  │ (Core 0) │ │ (Core 1) │ │(C2) │ │ │
│  │    • P2P Signaling   │    │  └────┬─────┘ └────┬─────┘ └──┬──┘ │ │
│  └──────────────────────┘    │       │            │          │    │ │
│                              │       └────────────┼──────────┘    │ │
│                              │              Routers (Rooms)       │ │
│                              └────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐ │
│  │      PostgreSQL      │    │             Redis                  │ │
│  │    (Users, Rooms)    │    │    (Sessions, Pub/Sub, Presence)   │ │
│  └──────────────────────┘    └────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │  P2P 1:1 │   │ SFU Room │   │ SFU 1:1  │
              │  Direct  │   │  (3-12)  │   │ Fallback │
              └──────────┘   └──────────┘   └──────────┘
```

### mediasoup Concepts

| Concept | Description | Lifecycle |
|---------|-------------|-----------|
| **Worker** | C++ process handling media. 1 per CPU core. | Application lifetime |
| **Router** | Routes media between participants. **= Room** | Room lifetime |
| **Transport** | User's WebRTC connection | User session |
| **Producer** | User's outgoing audio (microphone) | User session |
| **Consumer** | User's incoming audio (from others) | Per remote participant |

### Capacity Estimates ($48/mo Droplet)

| Configuration | Concurrent Capacity |
|---------------|---------------------|
| P2P 1:1 calls (signaling only) | ~2,000+ pairs |
| SFU room participants | ~300-500 users |
| Mixed (70% P2P, 30% SFU) | ~2,000+ total users |

### Audio Configuration

```javascript
// Opus codec configuration
mediaCodecs: [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
    parameters: {
      usedtx: 1,        // Discontinuous transmission (save bandwidth)
      'sprop-stereo': 1
    }
  }
]
```

### Room State Management

```javascript
// In-memory room state (backed by Redis for multi-instance)
interface VoiceRoom {
  id: string;
  router: mediasoup.Router;
  participants: Map<string, {
    odlctransport: WebRtcTransport;
    odlcproducer: Producer | null;
    odlcconsumers: Map<string, Consumer>;
    odlcjoinedAt: number;
  }>;
  audioLevelObserver: AudioLevelObserver;
  ownerId: string;
  maxParticipants: number;
}
```

### P2P Signaling Flow (1:1 Calls)

```
User A                    Server                    User B
   │                         │                         │
   │──── find-partner ──────►│                         │
   │                         │◄──── find-partner ──────│
   │                         │                         │
   │◄──── matched ───────────│────── matched ─────────►│
   │                         │                         │
   │──── offer (SDP) ───────►│────── offer (SDP) ─────►│
   │                         │                         │
   │◄──── answer (SDP) ──────│◄───── answer (SDP) ────│
   │                         │                         │
   │◄──── ICE candidates ────│◄───── ICE candidates ──│
   │────► ICE candidates ────│─────► ICE candidates ──►│
   │                         │                         │
   │◄═══════════════════ P2P CONNECTED ══════════════►│
```

### SFU Fallback Trigger

```javascript
// Detect P2P failure and fallback to SFU
const P2P_TIMEOUT = 10000; // 10 seconds

async function connectP2P(partnerId) {
  const pc = new RTCPeerConnection(config);
  
  const timeout = setTimeout(() => {
    if (pc.connectionState !== 'connected') {
      pc.close();
      fallbackToSFU(partnerId);
    }
  }, P2P_TIMEOUT);
  
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      clearTimeout(timeout);
    }
  };
}
```

---

## Database Schema

### Drizzle Schema

```typescript
// packages/shared/db/schema.ts

import { pgTable, uuid, varchar, text, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const roomParticipantRole = pgEnum('room_participant_role', ['owner', 'participant']);

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  bio: text('bio'),
  nativeLanguages: text('native_languages').array().default([]),
  learningLanguages: text('learning_languages').array().default([]),
  isOnline: boolean('is_online').default(false),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Rooms
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  topic: varchar('topic', { length: 200 }),
  languages: text('languages').array().default([]),
  maxParticipants: integer('max_participants').default(12).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// Room Participants
export const roomParticipants = pgTable('room_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: roomParticipantRole('role').default('participant').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
});

// Refresh Tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Future tables (Phase 2+)
// - friendships
// - friend_requests  
// - messages
// - follows
// - notifications
// - premium_subscriptions
```

### Indexes

```typescript
// Performance indexes
export const roomsOwnerIdx = index('rooms_owner_idx').on(rooms.ownerId);
export const roomsActiveIdx = index('rooms_active_idx').on(rooms.isActive);
export const participantsRoomIdx = index('participants_room_idx').on(roomParticipants.roomId);
export const participantsUserIdx = index('participants_user_idx').on(roomParticipants.userId);
```

---

## API Design

### Base URL
```
Production: https://api.free2talk.com/v1
Development: http://localhost:3001/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create account | No |
| POST | `/auth/login` | Get access + refresh tokens | No |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| POST | `/auth/refresh` | Get new access token | No* |
| GET | `/auth/me` | Get current user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/:id` | Get user profile | Yes |
| PATCH | `/users/me` | Update own profile | Yes |
| GET | `/users/me/rooms` | Get user's room history | Yes |

### Room Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/rooms` | List active rooms (hallway) | Yes |
| POST | `/rooms` | Create new room | Yes |
| GET | `/rooms/:id` | Get room details | Yes |
| DELETE | `/rooms/:id` | Close room (owner only) | Yes |
| POST | `/rooms/:id/join` | Join room, get voice token | Yes |
| POST | `/rooms/:id/leave` | Leave room | Yes |
| POST | `/rooms/:id/kick/:userId` | Kick user (owner only) | Yes |
| POST | `/rooms/:id/transfer/:userId` | Transfer ownership | Yes |

### Voice Endpoints (mediasoup)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/voice/rtp-capabilities` | Get router RTP capabilities | Yes |
| POST | `/voice/transport` | Create WebRTC transport | Yes |
| POST | `/voice/transport/connect` | Connect transport (DTLS) | Yes |
| POST | `/voice/produce` | Start producing audio | Yes |
| POST | `/voice/consume` | Start consuming audio | Yes |

### Socket.io Events

```typescript
// Client → Server
interface ClientToServerEvents {
  // Hallway
  'hallway:subscribe': () => void;
  'hallway:unsubscribe': () => void;
  
  // Room
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'room:mute': (muted: boolean) => void;
  
  // Voice (mediasoup signaling)
  'voice:get-rtp-capabilities': (callback: (caps: RtpCapabilities) => void) => void;
  'voice:create-transport': (callback: (params: TransportParams) => void) => void;
  'voice:connect-transport': (dtlsParameters: DtlsParameters) => void;
  'voice:produce': (rtpParameters: RtpParameters, callback: (id: string) => void) => void;
  'voice:consume': (producerId: string, callback: (params: ConsumerParams) => void) => void;
  
  // P2P Signaling (1:1)
  'p2p:find-partner': (preferences: MatchPreferences) => void;
  'p2p:cancel-search': () => void;
  'p2p:signal': (targetId: string, signal: SignalData) => void;
  'p2p:end-call': () => void;
}

// Server → Client
interface ServerToClientEvents {
  // Hallway
  'hallway:room-created': (room: RoomSummary) => void;
  'hallway:room-updated': (room: RoomSummary) => void;
  'hallway:room-closed': (roomId: string) => void;
  
  // Room
  'room:user-joined': (participant: Participant) => void;
  'room:user-left': (userId: string) => void;
  'room:user-muted': (userId: string, muted: boolean) => void;
  'room:user-kicked': (userId: string) => void;
  'room:owner-changed': (newOwnerId: string) => void;
  'room:closed': (reason: string) => void;
  'room:active-speaker': (userId: string | null) => void;
  
  // Voice
  'voice:new-producer': (userId: string, producerId: string) => void;
  'voice:producer-closed': (producerId: string) => void;
  
  // P2P
  'p2p:matched': (partner: PartnerInfo) => void;
  'p2p:signal': (fromId: string, signal: SignalData) => void;
  'p2p:partner-left': () => void;
  
  // Errors
  'error': (error: { code: string; message: string }) => void;
}
```

---

## Frontend Architecture

### Zustand Stores

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// stores/roomStore.ts
interface RoomState {
  currentRoom: Room | null;
  participants: Map<string, Participant>;
  isMuted: boolean;
  isConnecting: boolean;
  activeSpeaker: string | null;
  
  setRoom: (room: Room | null) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  setMuted: (muted: boolean) => void;
  setActiveSpeaker: (userId: string | null) => void;
}

// stores/voiceStore.ts
interface VoiceState {
  device: mediasoupClient.Device | null;
  sendTransport: mediasoupClient.Transport | null;
  recvTransport: mediasoupClient.Transport | null;
  producer: mediasoupClient.Producer | null;
  consumers: Map<string, mediasoupClient.Consumer>;
  
  initDevice: (routerRtpCapabilities: RtpCapabilities) => Promise<void>;
  createTransports: () => Promise<void>;
  produce: () => Promise<void>;
  consume: (producerId: string, userId: string) => Promise<void>;
  cleanup: () => void;
}
```

### Key Components

```
components/
├── room/
│   ├── RoomPage.tsx           # Main room view
│   ├── ParticipantGrid.tsx    # Grid of participant tiles
│   ├── ParticipantTile.tsx    # Single participant (avatar, name, speaking)
│   ├── RoomControls.tsx       # Mute, leave, settings buttons
│   ├── OwnerControls.tsx      # Kick, transfer, close room
│   └── AudioVisualizer.tsx    # Speaking indicator animation
│
├── hallway/
│   ├── HallwayPage.tsx        # Room list view
│   ├── RoomCard.tsx           # Single room preview
│   ├── CreateRoomModal.tsx    # Room creation form
│   ├── RoomFilters.tsx        # Language, topic filters
│   └── SearchBar.tsx          # Search rooms
│
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthGuard.tsx          # Protected route wrapper
│
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── MobileNav.tsx
```

---

## Security & Authentication

### JWT Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN FLOW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login Request                                                   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐     ┌─────────────┐                            │
│  │   Access    │     │   Refresh   │                            │
│  │   Token     │     │   Token     │                            │
│  │  (15 min)   │     │  (7 days)   │                            │
│  └──────┬──────┘     └──────┬──────┘                            │
│         │                   │                                    │
│         │ Header            │ httpOnly Cookie                    │
│         │ Authorization     │ + Redis storage                    │
│         │                   │                                    │
│         ▼                   ▼                                    │
│  API Requests         Token Refresh                              │
│                       (rotate on use)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with cost factor 12 |
| **Rate Limiting** | express-rate-limit + Redis store |
| **Input Validation** | Zod schemas on all endpoints |
| **CORS** | Strict origin whitelist |
| **Helmet** | Security headers |
| **SQL Injection** | Drizzle ORM (parameterized queries) |
| **XSS** | React default escaping |
| **WebSocket Auth** | JWT validation on connection |

### Rate Limits

```javascript
// Auth endpoints: 5 requests per 15 minutes
// API endpoints: 100 requests per minute
// Voice signaling: 50 requests per minute
```

---

## Deployment Strategy

### Single Droplet Architecture (Phase 1-2)

```
DigitalOcean Droplet ($48/mo)
├── 4 vCPU, 8GB RAM
├── Ubuntu 22.04
├── Docker + Docker Compose
│
├── Services:
│   ├── nginx (reverse proxy, SSL termination)
│   ├── api (Express + mediasoup)
│   ├── web (Next.js)
│   ├── postgresql
│   ├── redis
│   └── coturn (TURN server)
│
└── SSL: Let's Encrypt (auto-renewal)
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
      - web

  api:
    build: ./apps/api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - MEDIASOUP_ANNOUNCED_IP=${PUBLIC_IP}
    ports:
      - "3001:3001"
      - "10000-10100:10000-10100/udp"  # mediasoup RTC
    depends_on:
      - postgres
      - redis

  web:
    build: ./apps/web
    environment:
      - NEXT_PUBLIC_API_URL=https://api.free2talk.com
      - NEXT_PUBLIC_WS_URL=wss://api.free2talk.com
    ports:
      - "3000:3000"

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=free2talk
      - POSTGRES_USER=free2talk
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  coturn:
    image: coturn/coturn:latest
    network_mode: host
    volumes:
      - ./turnserver.conf:/etc/turnserver.conf

volumes:
  postgres_data:
  redis_data:
```

### Firewall Rules

```bash
# Required ports
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3478/tcp    # TURN TCP
ufw allow 3478/udp    # TURN UDP
ufw allow 5349/tcp    # TURN TLS
ufw allow 10000:10100/udp  # mediasoup RTC
ufw allow 49152:65535/udp  # TURN relay
```

### Scaling Path

```
Phase 1-2: Single Droplet ($48/mo)
    │
    │ When: >300 concurrent SFU users
    ▼
Phase 3: Separate Media Server ($48/mo + $24/mo)
    │
    │ When: >1000 concurrent users
    ▼
Phase 4: Kubernetes + Multiple Media Servers
```

---

## Phase Breakdown

### Phase 1: MVP (7 weeks)
> Core voice rooms functionality

**Deliverables:**
- User authentication (email/password)
- Room creation and management
- Voice chat via mediasoup SFU
- Owner controls (kick, transfer, close)
- Real-time hallway updates
- Basic responsive UI

**Success Metrics:**
- Users can create and join voice rooms
- Voice quality is clear and stable
- Owner controls work correctly
- Ownership transfers on disconnect

### Phase 2: Random Partner & Polish (4 weeks)
> 1:1 matching and user experience improvements

**Deliverables:**
- P2P random partner matching
- SFU fallback for NAT issues
- OAuth login (Google, Discord)
- Profile editing
- Room search and filters
- Text chat in rooms

### Phase 3: Social Features (4 weeks)
> Friends, DMs, and social graph

**Deliverables:**
- Friends system
- Direct messages
- 1:1 voice calls (DM)
- Followers/following
- Notifications

### Phase 4: Premium & Scale (4 weeks)
> Monetization and mobile

**Deliverables:**
- Premium features (themes, badges)
- Room scheduling
- Language analytics
- Mobile apps (React Native)
- Horizontal scaling

---

## Appendix

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/free2talk

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# mediasoup
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=your.public.ip
MEDIASOUP_RTC_MIN_PORT=10000
MEDIASOUP_RTC_MAX_PORT=10100

# TURN
TURN_SERVER_URL=turn:your.domain.com:3478
TURN_USERNAME=turnuser
TURN_PASSWORD=turnpass

# General
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Useful Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio

# Production
pnpm build            # Build all apps
pnpm start            # Start production servers
docker-compose up -d  # Start with Docker
```

---
