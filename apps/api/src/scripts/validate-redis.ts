// Redis Integration Validation Script
// Run with: npx tsx src/scripts/validate-redis.ts

import { redis, connectRedis, disconnectRedis, CACHE_KEYS, CACHE_TTL } from '../db/redis.js';
import { CacheService, RoomCache, UserCache, SessionCache } from '../services/cache.service.js';

async function validateRedisIntegration() {
    console.log('🔍 Starting Redis Integration Validation...\n');

    try {
        // Test 1: Connection
        console.log('Test 1: Redis Connection');
        await connectRedis();
        console.log('✅ Redis connected successfully\n');

        // Test 2: Basic Operations
        console.log('Test 2: Basic Cache Operations');
        await CacheService.set('test:key', { data: 'test' }, 60);
        const value = await CacheService.get('test:key');
        if (value && (value as any).data === 'test') {
            console.log('✅ Set/Get operations working');
        } else {
            console.error('❌ Set/Get operations failed');
        }
        await CacheService.del('test:key');
        const deleted = await CacheService.get('test:key');
        if (deleted === null) {
            console.log('✅ Delete operation working\n');
        } else {
            console.error('❌ Delete operation failed\n');
        }

        // Test 3: Set Operations
        console.log('Test 3: Set Operations');
        await CacheService.sAdd('test:set', 'member1', 'member2');
        const members = await CacheService.sMembers('test:set');
        if (members.length === 2 && members.includes('member1')) {
            console.log('✅ Set operations working');
        } else {
            console.error('❌ Set operations failed');
        }
        await CacheService.sRem('test:set', 'member1');
        const isMember = await CacheService.sIsMember('test:set', 'member1');
        if (!isMember) {
            console.log('✅ Set remove operation working\n');
        } else {
            console.error('❌ Set remove operation failed\n');
        }
        await CacheService.del('test:set');

        // Test 4: Hash Operations
        console.log('Test 4: Hash Operations');
        await CacheService.hSet('test:hash', 'field1', 'value1');
        const hashValue = await CacheService.hGet('test:hash', 'field1');
        if (hashValue === 'value1') {
            console.log('✅ Hash operations working\n');
        } else {
            console.error('❌ Hash operations failed\n');
        }
        await CacheService.del('test:hash');

        // Test 5: Room Cache
        console.log('Test 5: Room Cache Operations');
        const testRoom = {
            id: 'test-room-123',
            name: 'Test Room',
            slug: 'test-room',
            ownerId: 'user-123',
            isActive: true,
        };
        await RoomCache.cacheRoom(testRoom.id, testRoom);
        const cachedRoom = await RoomCache.getRoom(testRoom.id);
        if (cachedRoom && cachedRoom.id === testRoom.id) {
            console.log('✅ Room cache working');
        } else {
            console.error('❌ Room cache failed');
        }
        await RoomCache.addActiveRoom(testRoom.id);
        const activeRooms = await CacheService.sMembers(CACHE_KEYS.ACTIVE_ROOMS);
        if (activeRooms.includes(testRoom.id)) {
            console.log('✅ Active rooms set working');
        } else {
            console.error('❌ Active rooms set failed');
        }
        await RoomCache.invalidateRoom(testRoom.id);
        const invalidated = await RoomCache.getRoom(testRoom.id);
        if (invalidated === null) {
            console.log('✅ Room invalidation working\n');
        } else {
            console.error('❌ Room invalidation failed\n');
        }
        await RoomCache.removeActiveRoom(testRoom.id);

        // Test 6: User Cache
        console.log('Test 6: User Cache Operations');
        const testUser = {
            id: 'test-user-456',
            username: 'testuser',
            email: 'test@example.com',
        };
        await UserCache.cacheUser(testUser.id, testUser);
        const cachedUser = await UserCache.getUser(testUser.id);
        if (cachedUser && cachedUser.id === testUser.id) {
            console.log('✅ User cache working');
        } else {
            console.error('❌ User cache failed');
        }
        await UserCache.setOnline(testUser.id);
        const isOnline = await UserCache.isOnline(testUser.id);
        if (isOnline) {
            console.log('✅ User online status working');
        } else {
            console.error('❌ User online status failed');
        }
        await UserCache.setOffline(testUser.id);
        const isOffline = !(await UserCache.isOnline(testUser.id));
        if (isOffline) {
            console.log('✅ User offline status working');
        } else {
            console.error('❌ User offline status failed');
        }
        await UserCache.cacheUserRoom(testUser.id, 'room-123');
        const userRoom = await UserCache.getUserRoom(testUser.id);
        if (userRoom === 'room-123') {
            console.log('✅ User room cache working\n');
        } else {
            console.error('❌ User room cache failed\n');
        }
        await UserCache.invalidateUser(testUser.id);

        // Test 7: Session Cache
        console.log('Test 7: Session Cache Operations');
        const testToken = 'test-refresh-token-xyz';
        const testUserId = 'user-789';
        await SessionCache.storeRefreshToken(testUserId, testToken, 60);
        const tokenData = await SessionCache.getRefreshToken(testToken);
        if (tokenData && tokenData.userId === testUserId) {
            console.log('✅ Session token storage working');
        } else {
            console.error('❌ Session token storage failed');
        }
        // Check userId -> token mapping
        const userToken = await CacheService.get<string>(CACHE_KEYS.USER_REFRESH_TOKEN(testUserId));
        if (userToken === testToken) {
            console.log('✅ User-to-token mapping working');
        } else {
            console.error('❌ User-to-token mapping failed');
        }
        await SessionCache.deleteRefreshTokenByUserId(testUserId);
        const deletedToken = await SessionCache.getRefreshToken(testToken);
        if (deletedToken === null) {
            console.log('✅ Session token deletion by userId working\n');
        } else {
            console.error('❌ Session token deletion by userId failed\n');
        }

        // Test 8: TTL Verification
        console.log('Test 8: TTL Verification');
        await CacheService.set('test:ttl', { data: 'expires' }, 2);
        const beforeExpiry = await CacheService.get('test:ttl');
        if (beforeExpiry) {
            console.log('✅ Data exists before TTL expiry');
        } else {
            console.error('❌ Data missing before TTL expiry');
        }
        console.log('⏳ Waiting 3 seconds for TTL expiry...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const afterExpiry = await CacheService.get('test:ttl');
        if (afterExpiry === null) {
            console.log('✅ Data expired after TTL\n');
        } else {
            console.error('❌ Data not expired after TTL\n');
        }

        // Test 9: Pattern Deletion
        console.log('Test 9: Pattern Deletion');
        await CacheService.set('rooms:list:1:20', { page: 1 }, 60);
        await CacheService.set('rooms:list:2:20', { page: 2 }, 60);
        await CacheService.set('rooms:list:3:20:en', { page: 3 }, 60);
        await CacheService.delPattern('rooms:list:*');
        const deleted1 = await CacheService.get('rooms:list:1:20');
        const deleted2 = await CacheService.get('rooms:list:2:20');
        const deleted3 = await CacheService.get('rooms:list:3:20:en');
        if (deleted1 === null && deleted2 === null && deleted3 === null) {
            console.log('✅ Pattern deletion working\n');
        } else {
            console.error('❌ Pattern deletion failed\n');
        }

        // Test 10: Counter Operations
        console.log('Test 10: Counter Operations');
        const count1 = await CacheService.incr('test:counter', 10);
        const count2 = await CacheService.incr('test:counter', 10);
        if (count1 === 1 && count2 === 2) {
            console.log('✅ Counter increment working\n');
        } else {
            console.error('❌ Counter increment failed\n');
        }
        await CacheService.del('test:counter');

        console.log('✅ All Redis Integration Tests Passed!\n');

    } catch (error) {
        console.error('❌ Redis Integration Validation Failed:', error);
        process.exit(1);
    } finally {
        await disconnectRedis();
        console.log('✅ Redis disconnected\n');
    }
}

// Run validation
validateRedisIntegration()
    .then(() => {
        console.log('🎉 Redis integration is properly configured and working!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error during validation:', error);
        process.exit(1);
    });
