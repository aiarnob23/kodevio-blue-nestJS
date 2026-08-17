import { Module } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { SessionService } from './sessions.service';
import { SESSION_REPOSITORY } from './interfaces/session-repository.interface';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { EncryptionModule } from 'src/core/security/encryption/encryption.module';
import { SessionCleanupWorker } from './workers/session-cleanup.worker';
import { SessionsController } from './sessions.controller';

@Module({
    imports: [EncryptionModule],
    controllers: [SessionsController],
    providers: [
        PrismaService,
        SessionCleanupWorker,
        {
            provide: SESSION_REPOSITORY,
            useClass: PrismaSessionRepository,
        },
        SessionService,
    ],
    exports: [SessionService],
})
export class SessionsModule { }