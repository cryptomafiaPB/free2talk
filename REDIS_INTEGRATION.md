# Redis Integration Summary

## Overview
Complete Redis integration for caching, session management, rate limiting, and presence tracking in the free2talk backend API.

## Architecture

### 1. Redis Client (`db/redis.ts`)
- **Connection**: Redis client with automatic reconnection strategy
- **Event Handlers**: Error handling, connection tracking, reconnection alerts
- **Key Organization**: Structured key prefixes for different data types
  - `room:*` - Room data and lists
  - `user:*` - User profiles and presence
  - `session:*` - Authentication sessions
  - `rl:*` - Rate limiting counters
- **TTL Strategies**:
  - SHORT (60s) - Frequently changing data (room participants)
  - MEDIUM (5min) - Semi-stable data (room details)
  - LONG (30min) - Stable data (user profiles)
  - SESSION (7 days) - Refresh tokens

### 2. Caching Service (`services/cache.service.ts`)
Three-tier architecture for scalability:

#### CacheService (Generic Layer)
- Core Redis operations (get, set, delete, exists, increment)
- Set operations (sAdd, sRem, sMembers)
- Hash operations (hSet, hGet, hGetAll)
- Pattern-based deletion for bulk invalidation

#### RoomCache (Domain Layer)
- `cacheRoom` / `getRoom` - Cache room details by ID and slug
- `invalidateRoom` - Clear room data on updates
- `cacheParticipants` - Store participant lists (60s TTL)
- `cacheRoomsList` - Cache paginated room listings
- `addActiveRoom` / `removeActiveRoom` - Maintain active room set

#### UserCache (Domain Layer)
- `cacheUser` / `getUser` - User profile caching (30min TTL)
- `invalidateUser` - Clear user data on profile updates
- `cacheUserRoom` / `getUserRoom` - Track user's current room
- `setOnline` / `setOffline` / `isOnline` - Presence tracking
- `getOnlineUsers` - Retrieve all online user IDs

#### SessionCache (Domain Layer)
- `storeRefreshToken` / `getRefreshToken` / `deleteRefreshToken` - Refresh token management (7d TTL)
- `storeSession` / `getSession` - Generic session data storage

### 3. Service Integration

#### Room Service (`services/room.service.ts`)
**Read Path** (Cache-First Strategy):
- `listActiveRooms`: Check cache → Query DB → Cache result
- `getRoomById`: Check cache → Query DB → Cache with both ID and slug keys
- `getRoomParticipants`: Check cache → Query DB → Cache with SHORT TTL

**Write Path** (Invalidation Strategy):
- `createRoom`: Create in DB → Invalidate list cache → Add to active set → Cache user room
- `updateRoom`: Update DB → Invalidate room cache → Invalidate list cache
- `closeRoom`: Close in DB → Remove from active set → Invalidate room + list caches
- `joinRoom` / `leaveRoom`: Modify DB → Invalidate room cache → Update user room cache
- `kickUser` / `transferOwnership`: Update DB → Invalidate room cache

#### User Controller (`controllers/user.controller.ts`)
- `getUserProfile`: Check `UserCache.getUser` → Query DB → Cache result
- `updateUserProfile`: Update DB → `UserCache.invalidateUser`

#### Auth Service (`services/auth.service.ts`)
**Registration / Login**:
1. Authenticate user
2. Generate JWT tokens
3. Store refresh token in Redis via `SessionCache.storeRefreshToken`
4. Set user online in DB and Redis (`UserCache.setOnline`)

**Token Refresh**:
1. Verify refresh token signature
2. Check token exists in Redis (`SessionCache.getRefreshToken`)
3. Validate token matches stored value
4. Delete old token → Generate new tokens → Store new token

**Logout**:
1. Delete refresh token from Redis (`SessionCache.deleteRefreshToken`)
2. Set user offline (`UserCache.setOffline`)
3. Invalidate user cache
4. Update DB

#### Socket Handlers (`socket/index.ts`)
**Connection**:
- JWT authentication on connect
- Set user online in DB + `UserCache.setOnline(userId)`

**Disconnection**:
- Set user offline in DB + `UserCache.setOffline(userId)`
- Handle ownership transfer for rooms
- Cleanup voice resources

### 4. Rate Limiting (`middleware/rate-limiter.middleware.ts`)
Redis-backed rate limiters using `rate-limit-redis`:

- **authRateLimiter**: 5 req/15min for login/register (per IP)
  - Skips counting successful requests (only tracks failed attempts)
- **roomCreationRateLimiter**: 10 rooms/hour (per user ID)
- **apiRateLimiter**: 100 req/15min for all API routes (per IP)
- **strictRateLimiter**: 3 req/hour for sensitive operations (per IP)

Applied to:
- `/api/v1/auth/register` and `/api/v1/auth/login` - authRateLimiter
- `/api/v1/rooms` (POST) - roomCreationRateLimiter
- `/api/*` - apiRateLimiter (global)

### 5. Protected Routes
- `/api/v1/auth/logout` - Requires JWT, clears Redis session
- `/api/v1/auth/me` - Requires JWT, returns cached user data

## Key Benefits

### Performance
- **Room Listings**: Cached with pagination, reduces DB load for browse page
- **User Profiles**: 30min cache, eliminates repeated queries
- **Room Details**: 5min cache, optimizes room join flow
- **Participants**: 60s cache with frequent invalidation for real-time accuracy

### Scalability
- **Session Storage**: Redis stores all refresh tokens (7d TTL), enables horizontal scaling
- **Rate Limiting**: Distributed rate limiting across instances
- **Presence Tracking**: Fast O(1) presence checks via Redis sets

### Security
- **Token Revocation**: Logout immediately invalidates refresh tokens
- **Rate Limiting**: Prevents brute force attacks on auth endpoints
- **IP-based Protection**: API rate limiter stops DDoS attempts

### Reliability
- **Automatic Reconnection**: Redis client reconnects on connection loss
- **Graceful Degradation**: Services continue with DB fallback if Redis fails
- **Cache Invalidation**: Ensures data consistency across updates

## Cache Invalidation Strategy

### When Data Changes
1. **Room Updates**: Invalidate specific room + list cache
2. **User Updates**: Invalidate user profile cache
3. **Room Closure**: Remove from active set + invalidate room + list
4. **User Logout**: Delete session + invalidate user cache

### TTL-based Expiration
- Frequent changes (participants) → Short TTL (60s)
- Semi-stable data (rooms) → Medium TTL (5min)
- Stable data (users) → Long TTL (30min)
- Session data → 7 days

## Redis Key Structure

```
# Room Data
room:id:{roomId}              -> Room details (JSON)
room:slug:{slug}              -> Room details (JSON)
room:participants:{roomId}     -> Participant list (JSON)
rooms:active                   -> Set of active room IDs
rooms:list:{page}:{lang}       -> Paginated room list (JSON)

# User Data
user:{userId}                  -> User profile (JSON)
user:room:{userId}             -> Current room ID (string)
user:online                    -> Set of online user IDs

# Sessions
session:refresh:{userId}       -> Refresh token (string)
session:data:{sessionId}       -> Session data (JSON)

# Rate Limiting
rl:auth:{ip}                   -> Auth attempt counter
rl:room:create:{userId}        -> Room creation counter
rl:api:{ip}                    -> General API request counter
rl:strict:{ip}                 -> Sensitive operation counter
```

## Configuration

### Environment Variables
```env
REDIS_URL=redis://localhost:6379
# Or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password (optional)
```

### Dependencies
```json
{
  "redis": "^4.7.0",
  "express-rate-limit": "^7.5.0",
  "rate-limit-redis": "^4.2.1"
}
```

## Testing Recommendations

### Unit Tests
- CacheService operations (get, set, delete)
- RoomCache/UserCache domain methods
- SessionCache token storage

### Integration Tests
- Room creation → cache population
- Room update → cache invalidation
- User login → session storage
- User logout → session cleanup
- Rate limiting enforcement

### Performance Tests
- Cache hit rate for room listings
- Response time with/without cache
- Rate limiter accuracy under load

## Monitoring Recommendations

### Redis Metrics
- Memory usage
- Cache hit/miss ratio
- Connection count
- Command latency

### Application Metrics
- Cache hit rate by operation
- Rate limiter trigger count
- Session storage size
- Online user count accuracy

## Future Enhancements

### Pub/Sub
- Add Redis Pub/Sub for inter-server communication
- Broadcast room updates across instances
- Sync presence across servers

### Advanced Caching
- Cache warming on startup
- Predictive cache preloading
- LRU eviction policies

### Analytics
- User activity tracking in Redis
- Room popularity metrics
- Peak usage analysis
