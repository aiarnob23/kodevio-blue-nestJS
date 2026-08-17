import 'dotenv/config';

export const env = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL!,
};

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
  },
  database: {
    databaseUrl: process.env.DATABASE_URL,
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
    },
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp' | 'ses' | 'resend'
    from: process.env.DEFAULT_FROM_EMAIL || 'no-reply@kodevio.dev',
    fromName: process.env.DEFAULT_FROM_NAME || 'Kodevio',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  otp: {
    length: parseInt(process.env.OTP_LENGTH || '6'),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.LOG_TO_FILE === 'true',
      path: process.env.LOG_FILE_PATH || 'logs/app.log',
    },
  },

  security: {
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
    jwt: {
      secret:
        process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error('JWT_SECRET must be set in production');
            })()
          : 'JWT_FALLBACK_SECRET_DEV_ONLY'),
      acessExpiresIn: Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? 900),
      refreshExpiresIn: Number(
        process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? 604800,
      ),
      issuer: process.env.JWT_ISSUER || 'ignitor-app',
    },
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
  },
};
