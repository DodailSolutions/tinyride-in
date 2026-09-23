import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../interceptors/correlation-id.interceptor';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      ((request as unknown as Record<string, unknown>)['correlationId'] as string) ||
      (request.headers[CORRELATION_ID_HEADER] as string) ||
      'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An internal server error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body['message'] as string) || exception.message;
        errorCode = (body['error'] as string) || HttpStatus[status] || 'HTTP_ERROR';
        details = body['details'] || (Array.isArray(body['message']) ? body['message'] : undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${correlationId}] Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    }

    const payload = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        correlationId,
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    response.status(status).json(payload);
  }
}
