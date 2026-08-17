import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './request-context.middleware';

@Module({})
export class RequestContextModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestContextMiddleware).forRoutes('*');
    }
}