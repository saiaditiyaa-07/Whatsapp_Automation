import { Request, Response, NextFunction } from 'express';
import { redis, isRedisEnabled } from '../config/redis';

// In-memory fallback tracking cache
interface MemoryLimit {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryLimit>();

// Run background pruning of memoryStore entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of memoryStore.entries()) {
    if (now > limit.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 300000);

export async function webhookRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Enforce limits by client IP address
  const identifier = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown-ip';
  
  const LIMIT = 60; // Max requests allowed
  const WINDOW_SECONDS = 60; // Time window duration

  if (isRedisEnabled && redis) {
    const redisKey = `ratelimit:${identifier}`;
    try {
      const currentRequests = await redis.incr(redisKey);
      if (currentRequests === 1) {
        await redis.expire(redisKey, WINDOW_SECONDS);
      }

      if (currentRequests > LIMIT) {
        console.warn(`[Rate Limiter]: Webhook request threshold exceeded for IP ${identifier} (Redis)`);
        res.status(429).json({
          success: false,
          error: 'Too many requests. Rate limit exceeded.',
        });
        return;
      }
      
      next();
      return;
    } catch (error) {
      console.error('[Rate Limiter Error]: Redis operation failed, falling back to memory store: ', error);
    }
  }

  // Memory fallback rate-limiting logic
  const now = Date.now();
  const limit = memoryStore.get(identifier);

  if (!limit || now > limit.resetAt) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + WINDOW_SECONDS * 1000,
    });
  } else {
    limit.count += 1;
    if (limit.count > LIMIT) {
      console.warn(`[Rate Limiter]: Webhook request threshold exceeded for IP ${identifier} (Memory)`);
      res.status(429).json({
        success: false,
        error: 'Too many requests. Rate limit exceeded.',
      });
      return;
    }
  }

  next();
}
