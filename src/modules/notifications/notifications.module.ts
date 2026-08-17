import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationsService } from './notifications.service';
import { NotificationWorker } from './workers/notifications.worker';

@Module({
    imports: [EmailModule],
    providers: [NotificationsService, NotificationWorker],
    exports: [NotificationsService],
})
export class NotificationsModule { }