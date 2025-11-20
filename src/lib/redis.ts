import IORedis from 'ioredis';

const connectionString = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new IORedis(connectionString, {
    maxRetriesPerRequest: null, // Required for BullMQ
    lazyConnect: false, // Connect immediately to fail fast if Redis is down
    retryStrategy: (times) => {
        // Stop retrying after 10 times
        if (times > 10) {
            return null;
        }
        return Math.min(times * 100, 3000);
    },
});

// Prevent crashing on connection error
redis.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
});
