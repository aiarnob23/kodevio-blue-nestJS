import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN'],
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (existingAdmin) {
    console.log(
      `[Seed] Admin already exists: ${existingAdmin.email} (${existingAdmin.role})`,
    );

    return;
  }

  const email = process.env.DEFAULT_ADMIN_EMAIL;

  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be configured',
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 12 * 1024,
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,

      role: 'SUPER_ADMIN',
      status: 'ACTIVE',

      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },

    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(
    `[Seed] Default ${admin.role} created: ${admin.email}`,
  );
}

main()
  .catch((error) => {
    console.error('[Seed] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });