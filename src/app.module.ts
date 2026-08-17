import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { RateLimitModule } from './core/rate-limit/module/ rate-limit.module';
import { AppLoggerModule } from './core/logging/logger.module';
import { RequestContextModule } from './core/context/request/request-context.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './core/rate-limit/guards/rate-limit.guard';
import { AppService } from './app.service';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { BullMQModule } from './infrastructure/queues/bullmq.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { SeederModule } from './infrastructure/database/prisma/seeders/seeder.module';

@Module({
  imports: [
    RedisModule,
    BullMQModule,
    RateLimitModule,
    SeederModule,
    AppLoggerModule,
    PrismaModule,
    RequestContextModule,
    UsersModule,
    AuthModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule { }
