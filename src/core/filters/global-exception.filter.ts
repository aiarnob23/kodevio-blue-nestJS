import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exceptions';
import { AppLogger } from '../logging/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLogger
  ) { }
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Custom AppException
    if (exception instanceof AppException) {
      return response.status(exception.statusCode).json({
        success: false,
        code: exception.code,
        message: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    // NestJS built-in HttpException 
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ?? exception.message;

      return response.status(exception.getStatus()).json({
        success: false,
        code: 'HTTP_EXCEPTION',
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }

    this.logger.logError('Unhandled exception', {
      error: (exception as Error)?.message,
      stack: (exception as Error)?.stack,
      path: request.url,
    });

    // Unexpected error
    const isDev = process.env.NODE_ENV === 'development';
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      ...(isDev && { debug: (exception as Error)?.message }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}