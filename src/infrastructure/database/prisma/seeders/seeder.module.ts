import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/infrastructure/database/prisma/prisma.module';

import { AdminSeeder } from './admin.seeder';
import { SeederService } from './seeder.service';

@Module({
  imports: [PrismaModule],
  providers: [
    AdminSeeder,
    SeederService,
  ],
  exports: [SeederService],
})
export class SeederModule {}