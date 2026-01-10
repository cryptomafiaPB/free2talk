# Free2Talk - Phase 1 Implementation Plan

> **Goal**: Launch MVP with voice rooms, authentication, and core owner controls.

> **Outcome**: Users can register, browse rooms, create rooms, and have voice conversations.

---

## Scope Overview

### ✅ In Scope
- Email/password authentication (JWT)
- User registration with basic profile
- Room list display (hallway)
- Create room (name, topic, languages, max 2-12 users)
- Join/leave voice rooms
- Real-time voice chat via mediasoup SFU
- Self mute/unmute
- Speaking indicators
- Owner controls: kick user, close room
- Ownership transfer (manual + auto on disconnect)
- Auto-close empty rooms
- Basic responsive UI

### ❌ Out of Scope (Future Phases)
- OAuth providers (Google, Discord)
- Random 1:1 partner matching
- P2P voice (1:1 optimization)
- DMs and text chat
- Friends/followers system
- User profile editing
- Room search and filters
- Premium features

---

## Architecture Summary

### Voice Strategy
**SFU-only for Phase 1** - All voice rooms use mediasoup. P2P optimization for 1:1 deferred to Phase 2.

### Key Components
```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  Next.js + Tailwind + shadcn/ui + mediasoup-client      │
└─────────────────────────────────────────────────────────┘
                            │
                     REST + Socket.io
                            │
┌─────────────────────────────────────────────────────────┐
│                       Backend                            │
│  Express + Socket.io + mediasoup Workers                │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         PostgreSQL      Redis      mediasoup
         (Drizzle)    (sessions)    (3 workers)
```

---

## Week-by-Week Breakdown

### Week 1: Project Foundation
**Objective**: Dev environment and project structure ready

- [ ] Initialize Turborepo monorepo
- [ ] Set up Next.js app with Tailwind + shadcn/ui
- [ ] Set up Express server with TypeScript
- [ ] Configure Docker Compose (PostgreSQL, Redis)
- [ ] Set up Drizzle ORM with initial migrations
- [ ] Create shared types package

**Deliverable**: `pnpm dev` starts full stack locally

---

### Week 2: Authentication System
**Objective**: Users can register and login

- [ ] Design users table schema
- [ ] Implement register endpoint with validation
- [ ] Implement login endpoint with JWT generation
- [ ] Set up refresh token rotation (Redis-stored)
- [ ] Create auth middleware for protected routes
- [ ] Build login/register UI pages
- [ ] Implement auth context in frontend
- [ ] Add protected route wrapper

**Deliverable**: User can register → login → access protected pages

---

### Week 3: Room CRUD & Hallway
**Objective**: Users can see and create rooms

- [ ] Design rooms table schema
- [ ] Implement create room endpoint
- [ ] Implement list active rooms endpoint
- [ ] Implement get room details endpoint
- [ ] Set up Socket.io connection
- [ ] Build hallway page with room cards
- [ ] Build create room modal
- [ ] Add real-time room list updates

**Deliverable**: User can create room, see it appear in hallway

---

### Week 4: mediasoup Integration
**Objective**: Basic voice connectivity working

- [ ] Set up mediasoup worker pool (3 workers)
- [ ] Implement Router management (room → router mapping)
- [ ] Build transport creation endpoint
- [ ] Build produce/consume endpoints
- [ ] Integrate mediasoup-client in frontend
- [ ] Create voice room page layout
- [ ] Implement join flow (transport → produce → consume)
- [ ] Add participant list with connection status

**Deliverable**: Two users can join room and hear each other

---

### Week 5: Voice Controls & UX
**Objective**: Full voice room functionality

- [ ] Implement mute/unmute (producer.pause/resume)
- [ ] Add AudioLevelObserver for speaking detection
- [ ] Build speaking indicators UI
- [ ] Handle user leaving (cleanup producers/consumers)
- [ ] Add room participant count updates
- [ ] Implement device selection (microphone picker)
- [ ] Add audio level meter (pre-join check)

**Deliverable**: Fully functional voice room with mute and speaking indicators

---

### Week 6: Owner Controls & Room Lifecycle
**Objective**: Room management complete

- [ ] Design room_participants table with `joined_at`
- [ ] Implement kick user functionality
- [ ] Implement close room functionality
- [ ] Build manual ownership transfer
- [ ] Implement auto-transfer on owner disconnect
- [ ] Implement auto-close on empty room
- [ ] Add "room is full" handling
- [ ] Owner controls UI (kick button, close button)

**Deliverable**: Owner can manage room, ownership transfers correctly

---

### Week 7: Polish & Deployment
**Objective**: Production-ready MVP

- [ ] Error boundaries and toast notifications
- [ ] Loading states and skeletons
- [ ] Reconnection logic (mediasoup + socket)
- [ ] Mobile responsive testing
- [ ] Set up coturn TURN server
- [ ] Configure nginx with SSL
- [ ] Deploy to DigitalOcean droplet
- [ ] Set up basic monitoring (logs)
- [ ] Test with real users

**Deliverable**: Live MVP at free2talk.com

---

## Database Schema (Phase 1)

```sql
-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  username        VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(100),
  password_hash   TEXT NOT NULL,
  is_online       BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  owner_id        UUID REFERENCES users(id) NOT NULL,
  topic           VARCHAR(200),
  languages       TEXT[],
  max_participants INTEGER DEFAULT 12 CHECK (max_participants >= 2 AND max_participants <= 12),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  closed_at       TIMESTAMP
);

-- Room Participants
CREATE TABLE room_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  role            VARCHAR(20) DEFAULT 'participant',
  joined_at       TIMESTAMP DEFAULT NOW(),
  left_at         TIMESTAMP,
  UNIQUE(room_id, user_id, joined_at)
);

-- Indexes
CREATE INDEX idx_rooms_active ON rooms(is_active) WHERE is_active = true;
CREATE INDEX idx_participants_room ON room_participants(room_id) WHERE left_at IS NULL;
```

---

## API Endpoints (Phase 1)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create account | No |
| POST | `/api/v1/auth/login` | Get tokens | No |
| POST | `/api/v1/auth/logout` | Invalidate refresh | Yes |
| POST | `/api/v1/auth/refresh` | New access token | No |
| GET | `/api/v1/auth/me` | Current user | Yes |
| GET | `/api/v1/rooms` | List active rooms | Yes |
| POST | `/api/v1/rooms` | Create room | Yes |
| GET | `/api/v1/rooms/:id` | Room details | Yes |
| POST | `/api/v1/rooms/:id/join` | Join room | Yes |
| POST | `/api/v1/rooms/:id/leave` | Leave room | Yes |
| DELETE | `/api/v1/rooms/:id` | Close room | Yes (owner) |
| POST | `/api/v1/rooms/:id/kick/:userId` | Kick user | Yes (owner) |
| POST | `/api/v1/rooms/:id/transfer/:userId` | Transfer ownership | Yes (owner) |
| POST | `/api/v1/voice/transport` | Create transport | Yes |
| POST | `/api/v1/voice/connect` | Connect transport | Yes |
| POST | `/api/v1/voice/produce` | Start producing | Yes |
| POST | `/api/v1/voice/consume` | Consume producer | Yes |

---

## Key User Flows

### Join Room Flow
```
User clicks "Join" on room card
         │
         ▼
┌─────────────────┐
│ Check room full │──Yes──→ Show "Room Full" message
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Request mic     │──Denied──→ Show permission error
│   permission    │
└────────┬────────┘
         │ Granted
         ▼
┌─────────────────┐
│ Create WebRTC   │
│   transport     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Connect & start │
│   producing     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create consumers│
│ for all others  │
└────────┬────────┘
         │
         ▼
    In Voice Room ✓
```

### Owner Disconnect Flow
```
Owner connection lost
         │
         ▼
┌─────────────────────┐
│ Wait 5s for         │──Reconnects──→ Continue as owner
│ reconnection        │
└──────────┬──────────┘
           │ No reconnect
           ▼
┌─────────────────────┐
│ Other participants? │──No──→ Close room & cleanup
└──────────┬──────────┘
           │ Yes
           ▼
┌─────────────────────┐
│ Find participant    │
│ with oldest         │
│ joined_at           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Transfer ownership  │
│ Update DB           │
│ Broadcast event     │
└─────────────────────┘
```

---

## Component Structure (Frontend)

```
components/
├── ui/                     # shadcn components
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthGuard.tsx
├── room/
│   ├── RoomCard.tsx        # Hallway room preview
│   ├── CreateRoomModal.tsx
│   ├── VoiceRoom.tsx       # Main room container
│   ├── ParticipantTile.tsx # Single participant
│   ├── ParticipantList.tsx
│   ├── AudioControls.tsx   # Mute, leave buttons
│   ├── OwnerControls.tsx   # Kick, close, transfer
│   └── DeviceSelector.tsx  # Mic selection
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── MainLayout.tsx
└── common/
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

---

## Success Criteria

### Functional
- [ ] User can register and login
- [ ] User can see list of active rooms
- [ ] User can create room with name, topic, languages
- [ ] User can join room and hear others
- [ ] User can speak and be heard by others
- [ ] User can mute/unmute themselves
- [ ] Speaking user shows visual indicator
- [ ] Room shows current participant count
- [ ] Owner can kick participants
- [ ] Owner can close room
- [ ] Owner can transfer ownership
- [ ] Ownership auto-transfers on owner disconnect
- [ ] Empty rooms auto-close

### Non-Functional
- [ ] Voice latency < 300ms
- [ ] Supports 12 concurrent users per room
- [ ] Works on Chrome, Firefox, Safari
- [ ] Mobile responsive (phones, tablets)
- [ ] Graceful error handling with user feedback

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| mediasoup complexity | Start with single worker, expand after basics work |
| WebRTC browser issues | Test early on all target browsers |
| Scope creep | Strict "Phase 1 only" boundary, defer all nice-to-haves |
| Performance on droplet | Audio-only (no video), monitor CPU usage |
| NAT traversal failures | Deploy coturn in Week 7 before launch |

---

## Development Commands

```bash
# Start development
pnpm dev                    # All apps via Turborepo

# Database
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate            # Run migrations
pnpm db:studio             # Open Drizzle Studio

# Testing
pnpm test                  # Unit tests
pnpm test:e2e              # Playwright E2E

# Build
pnpm build                 # Production build
```

---

## Next Phase Preview

**Phase 2: Random Partner Matching**
- P2P signaling for 1:1 calls (zero server media cost)
- Matching queue with language preferences
- SFU fallback for NAT issues
- Match history and ratings
```

---