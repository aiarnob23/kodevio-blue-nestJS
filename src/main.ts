import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { AppLogger } from './core/logging/logger.service';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
   const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.use(cookieParser());
  app.enableCors({
  origin: ["http://localhost:5173", "http://localhost:3001"],
  credentials: true,
});
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.useGlobalFilters(new GlobalExceptionFilter(logger))
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
