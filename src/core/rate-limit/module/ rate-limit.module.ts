import { Module } from '@nestjs/common';
import { TokenBucketService } from '../services/token-bucket.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { RedisModule } from 'src/infrastructure/redis/redis.module';

@Module({
  imports:[RedisModule],
  providers: [
    TokenBucketService,
    RateLimitGuard,
  ],
  exports: [
    TokenBucketService,
    RateLimitGuard,
  ],
})
export class RateLimitModule {}