import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:16379');
  private hits = 0;
  private misses = 0;

  stats() {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, hitRate: total ? this.hits / total : 0 };
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) {
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, ttlSec = 60) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  }

  async del(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length) await this.redis.del(...keys);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}