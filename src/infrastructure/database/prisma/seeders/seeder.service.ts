import {
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { AppLogger } from 'src/core/logging/logger.service';

import { Seeder } from './seeder.interface';
import { AdminSeeder } from './admin.seeder';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly seeders: Seeder[];

  constructor(
    private readonly adminSeeder: AdminSeeder,
    private readonly logger: AppLogger,
  ) {
    this.seeders = [this.adminSeeder];
  }

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV?.toLowerCase() === 'test') {
      return;
    }

    await this.seed();
  }

  async seed(): Promise<void> {
    const orderedSeeders = [...this.seeders].sort(
      (a, b) => a.order - b.order,
    );

    this.logger.info(
      `Running ${orderedSeeders.length} database seeder(s)...`,
    );

    for (const seeder of orderedSeeders) {
      const startedAt = Date.now();

      try {
        await seeder.run();

        this.logger.info(`Seeder completed: ${seeder.name}`, {
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        this.logger.logError(`Seeder failed: ${seeder.name}`, {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });

        throw error;
      }
    }
  }
}