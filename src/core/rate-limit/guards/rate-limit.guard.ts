import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RATE_LIMIT_METADATA } from '../constants/rate-limit.constants';
import { RateLimitOptions } from '../interfaces/rate-limit-options.interface';
import { TokenBucketService } from '../services/token-bucket.service';
import { TooManyRequestException } from 'src/core/exceptions/too-many-request.exceptions';
import { ErrorCodes } from 'src/core/exceptions/error-codes';
import { RequestContext } from 'src/core/context/request/request-context';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenBucketService: TokenBucketService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options =
      this.reflector.get<RateLimitOptions>(
        RATE_LIMIT_METADATA,
        context.getHandler(),
      );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const identifier = this.getIdentifier(request, options);

    const key = this.buildRedisKey(options.bucket, identifier);

    const result = await this.tokenBucketService.consume(
      key,
      options.capacity,
      options.refillRate,
    );

    response.setHeader(
      'X-RateLimit-Remaining',
      Math.floor(result.remainingTokens),
    );

    response.setHeader(
      'Retry-After',
      result.retryAfter,
    );

    if (!result.allowed) {
      throw new TooManyRequestException(
        ErrorCodes.TOO_MANY_REQUESTS,
        'Rate limit exceeded',
      );
    }

    return true;
  }

  private getIdentifier(
    request: any,
    options: RateLimitOptions,
  ): string {
    if (
      options.keyby === 'user' &&
      request.user?.id
    ) {
      return String(request.user.id);
    }

    const context = RequestContext.get();
    return context?.ipAddress ?? 'unknown';
  }

  private buildRedisKey(
    bucket: string,
    identifier: string,
  ) {
    return `rate:${bucket}:${identifier}`;
  }
}