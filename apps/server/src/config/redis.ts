import Redis from 'ioredis';

let redis: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  redis = new Redis(url, {
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  return new Promise((resolve, reject) => {
    redis!.on('connect', () => resolve(redis!));
    redis!.on('error', (err) => {
      console.error('Redis error:', err.message);
      // Don't reject — allow app to continue without Redis
    });
    // Resolve after a short timeout even if not connected (for dev without Redis)
    setTimeout(() => resolve(redis!), 3000);
  });
}

export function getRedis(): Redis | null {
  return redis;
}

// Cache helpers
export async function cacheGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    // Silently fail — cache is optional
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}
