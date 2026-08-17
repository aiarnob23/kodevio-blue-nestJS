import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from 'src/infrastructure/queues/queue.constants';
import { NOTIFICATION_JOBS } from './notifications.constants';
import { SendEmailOptions } from '../email/interfaces/email-provider.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(QUEUES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async sendEmail(payload: SendEmailOptions): Promise<void> {
    await this.notificationQueue.add(
      NOTIFICATION_JOBS.SEND_EMAIL,
      { channel: 'email', ...payload },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }
}
