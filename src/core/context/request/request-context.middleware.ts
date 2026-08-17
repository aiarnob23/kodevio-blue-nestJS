import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const ctx: RequestContext = {
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] 
                ?? req.socket.remoteAddress 
                ?? 'unknown',
            userAgent: req.headers['user-agent'] ?? 'unknown',
            requestId: (req.headers['x-request-id'] as string) ?? randomUUID(),
        };

        res.setHeader('x-request-id', ctx.requestId);
        res.setHeader('x-forwarded-for', ctx.ipAddress);
        res.setHeader('user-agent', ctx.userAgent);

        RequestContext.storage.run(ctx, () => next());
    }
}