import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { UserRole, UserStatus } from 'generated/prisma/enums';
import * as argon2 from 'argon2';

import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { AppLogger } from 'src/core/logging/logger.service';
import { adminSeedConfig } from 'src/core/config/admin-seed.config';

import { Seeder } from './seeder.interface';

@Injectable()
export class AdminSeeder implements Seeder {
  readonly name = 'AdminSeeder';
  readonly order = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async run(): Promise<void> {
    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        status: {
          not: UserStatus.DELETED,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (existingAdmin) {
      this.logger.info(
        'Default admin creation skipped: an admin already exists.',
        {
          adminId: existingAdmin.id,
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      );

      return;
    }

    const passwordHash = await argon2.hash(adminSeedConfig.password, {
      type: argon2.argon2id,
    });

    try {
      const admin = await this.prisma.user.create({
        data: {
          email: adminSeedConfig.email,
          firstName: adminSeedConfig.firstName,
          lastName: adminSeedConfig.lastName,
          passwordHash,

          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,

          isEmailVerified: true,
          emailVerifiedAt: new Date(),

          deletedAt: null,
        },

        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      this.logger
        .warn(`Default SUPER_ADMIN account created. Change the default password immediately.,
        
          adminId: ${admin.id},
          email: ${admin.email}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.info(
          'Default admin was created concurrently by another instance. Skipping.',
        );

        return;
      }

      throw error;
    }
  }
}
