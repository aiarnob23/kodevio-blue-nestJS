import { Injectable } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from 'src/core/config';
import { IEmailProvider, SendEmailOptions } from '../interfaces/email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
    private readonly transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.smtp.host,
            port: config.email.smtp.port,
            secure: config.email.smtp.secure,
            auth: {
                user: config.email.smtp.user,
                pass: config.email.smtp.pass,
            },
        });
    }

    async send(options: SendEmailOptions): Promise<void> {
        await this.transporter.sendMail({
            from: `"${config.email.fromName}" <${config.email.from}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
    }
}