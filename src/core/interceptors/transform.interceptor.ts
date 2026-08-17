import {
    Injectable, NestInterceptor, ExecutionContext, CallHandler
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { ApiResponse } from '../response/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const request = context.switchToHttp().getRequest<Request>();

        return next.handle().pipe(
            map((data) => ({
                success: true,
                message: data?.message ?? 'Request successful',
                data: data?.data ?? null,
                timestamp: new Date().toISOString(),
                path: request.url,
            }))
        );
    }
}