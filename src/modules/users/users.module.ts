import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from './interfaces/user-repository.interface';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaModule } from 'src/infrastructure/database/prisma/prisma.module';
import { UsersController } from './users.controller';

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [
        UsersService,
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository,
        },
    ],
    exports: [UsersService],
})
export class UsersModule {}
