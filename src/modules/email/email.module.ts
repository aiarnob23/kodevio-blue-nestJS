import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER } from './interfaces/email-provider.interface';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { config } from 'src/core/config';

@Module({
    providers: [
        {
            provide: EMAIL_PROVIDER,
            useFactory: () => {
                switch (config.email.provider) {
                    case 'smtp':
                    default:
                        return new SmtpEmailProvider()
                    // case 'ses': return new SesEmailProvider();
                    // case 'resend': return new ResendEmailProvider();
                }
            },
        },
        EmailService,
    ],
    exports: [EmailService],
})
export class EmailModule { }