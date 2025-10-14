import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  private redis: Redis | null = null;

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis() {
    const redisUrl = this.configService.get<string | undefined>('REDIS_PRIVATE_URL')
      || this.configService.get<string | undefined>('REDIS_URL');

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
      } catch (error) {
        console.warn('[RedisHealthIndicator] Failed to initialize Redis client:', error.message);
      }
    }
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.redis) {
      return {
        [key]: {
          status: 'down',
          message: 'Redis not configured'
        }
      };
    }

    try {
      await this.redis.ping();
      return {
        [key]: {
          status: 'up'
        }
      };
    } catch (error) {
      return {
        [key]: {
          status: 'down',
          message: error.message
        }
      };
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
