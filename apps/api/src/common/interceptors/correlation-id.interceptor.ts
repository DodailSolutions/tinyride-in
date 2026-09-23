import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const existingId = request.headers[CORRELATION_ID_HEADER];
    const correlationId = (typeof existingId === 'string' && existingId.length > 0)
      ? existingId
      : randomUUID();

    // Attach to request for logging/tracing
    (request as unknown as Record<string, unknown>)['correlationId'] = correlationId;

    // Set response header
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle();
  }
}
