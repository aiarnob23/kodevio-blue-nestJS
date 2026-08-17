export const QUEUES = {
  SESSION: 'session-queue',
  NOTIFICATION: 'notification',
} as const;

export const SESSION_JOBS = {
  CLEANUP: 'cleanup',
} as const;

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'send-email',
  //PUSH
  //SMS
} as const;
