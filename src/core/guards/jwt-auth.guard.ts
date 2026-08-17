import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TokenService } from 'src/modules/auth/token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UnauthorizedException } from '../exceptions/unauthorized.exceptions';
import { ErrorCodes } from '../exceptions/error-codes';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/infrastructure/redis/redis.constant';

import { TOKEN_BLACKLIST_PREFIX } from 'src/modules/auth/auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly tokenService: TokenService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException(
                ErrorCodes.INVALID_TOKEN,
                'Access token is missing',
            );
        }
        const isBlacklisted = await this.redis.get(`${TOKEN_BLACKLIST_PREFIX}${token}`);
        if (isBlacklisted) {
            throw new UnauthorizedException(
                ErrorCodes.INVALID_TOKEN,
                'Access token is expired or revoked',
            );
        }

        request['user'] = this.tokenService.verifyAccessToken(token);
        return true;
    }

    private extractToken(request: Request): string | null {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}