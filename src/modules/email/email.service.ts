import { Inject, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/core/logging/logger.service';
import { EMAIL_PROVIDER, IEmailProvider, SendEmailOptions } from './interfaces/email-provider.interface';

@Injectable()
export class EmailService {
    constructor(
        @Inject(EMAIL_PROVIDER) private readonly provider: IEmailProvider,
        private readonly logger: AppLogger,
    ) { }

    async send(options: SendEmailOptions): Promise<void> {
        try {
            await this.provider.send(options);
            this.logger.info('Email sent', { to: options.to, subject: options.subject });
        } catch (error) {
            this.logger.logError('Failed to send email', {
                to: options.to,
                subject: options.subject,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}