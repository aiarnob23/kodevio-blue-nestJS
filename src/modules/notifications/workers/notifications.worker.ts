import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { config } from 'src/core/config';
import { AppLogger } from 'src/core/logging/logger.service';
import { QUEUES } from 'src/infrastructure/queues/queue.constants';
import { NOTIFICATION_JOBS } from '../notifications.constants';
import { EmailService } from '../../email/email.service';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;

  constructor(
    private readonly logger: AppLogger,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUES.NOTIFICATION,
      async (job) => {
        if (job.name === NOTIFICATION_JOBS.SEND_EMAIL) {
          await this.dispatch(job.data as NotificationPayload);
        }
      },
      {
        connection: {
          host: config.redis.host,
          port: config.redis.port,
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.info(`[Notification] Job ${job.id} completed`);
    });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`[Notification] Job ${job?.id} failed`, err.message);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async dispatch(payload: NotificationPayload): Promise<void> {
    switch (payload.channel) {
      case 'email':
        await this.emailService.send(payload);
        break;
      default:
        this.logger.error('[Notification] Unknown channel', payload as any);
    }
  }
}
