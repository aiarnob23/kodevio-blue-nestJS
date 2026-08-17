export interface EmailNotificationPayload {
    channel: 'email';
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// export type NotificationPayload = EmailNotificationPayload | SmsNotificationPayload;
export type NotificationPayload = EmailNotificationPayload;