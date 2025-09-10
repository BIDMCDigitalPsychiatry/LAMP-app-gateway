import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get error message
    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    // Only report non-HTTP exceptions or 5xx errors to Sentry
    if (!(exception instanceof HttpException) || status >= 500) {
      Sentry.captureException(exception, {
        tags: {
          path: request.url,
          method: request.method,
        },
      });
    }

    // Send error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
    });
  }
}