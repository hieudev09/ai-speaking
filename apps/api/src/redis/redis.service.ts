import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('RedisService');

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private isConnected = false;
  private memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

  async onModuleInit() {
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // Do not spam reconnect if not running
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          log.warn({ err }, 'Redis connection error — falling back to in-memory cache');
        }
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      log.info('Successfully connected to Redis');
    } catch {
      log.warn('Redis unreachable at startup — using in-memory fallback cache');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        this.isConnected = false;
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        this.isConnected = false;
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        this.isConnected = false;
      }
    }
    this.memoryCache.delete(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
