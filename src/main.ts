import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { AppLogger } from './core/logging/logger.service';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from './core/config';

let app: NestExpressApplication | undefined;

async function bootstrap() {
  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.flushLogs();

  if (config.security.trustProxy > 0) {
    app.set('trust proxy', config.security.trustProxy);
  }

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.security.cors.allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  logger.log(`🚀 Running on ${await app.getUrl()}`, 'Bootstrap');
}

async function gracefulExit(code: number, label: string, err: unknown) {
  console.error(`${label}:`, err);
  const killer = setTimeout(() => process.exit(code), 10_000);
  killer.unref();
  try {
    await app?.close();
  } catch (closeErr) {
    console.error('Shutdown failed:', closeErr);
  }
  process.exit(code);
}

process.on(
  'uncaughtException',
  (err) => void gracefulExit(1, 'Uncaught Exception', err),
);
process.on(
  'unhandledRejection',
  (reason) => void gracefulExit(1, 'Unhandled Rejection', reason),
);

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
