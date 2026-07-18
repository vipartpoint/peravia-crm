import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = uuidv4();
    const userId = (request.user as any)?.id || 'anonymous';
    const isProduction = process.env.NODE_ENV === 'production';

    let errorResponse: any;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      errorResponse = typeof res === 'string' ? { message: res } : (res as any);
    } else {
      errorResponse = { message: 'Internal server error' };
    }

    // Prepare log payload (Safe context for Sentry)
    const logPayload = {
      traceId,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userId,
      statusCode: status,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log the error locally
    if (status >= 500) {
      this.logger.error(`[${traceId}] ${request.method} ${request.url} - ${logPayload.error}`, logPayload.stack);
      
      // Dispatch to Sentry for 500+ errors
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(exception, {
          tags: {
            path: logPayload.path,
            method: logPayload.method,
            statusCode: status,
          },
          user: {
            id: logPayload.userId,
          },
          contexts: {
            trace: {
              trace_id: traceId,
              span_id: traceId.substring(0, 16),
            }
          }
        });
      }
    } else {
      this.logger.warn(`[${traceId}] ${request.method} ${request.url} - ${logPayload.error}`);
    }

    // Mask sensitive details in production
    const finalResponse = {
      statusCode: status,
      timestamp: logPayload.timestamp,
      path: request.url,
      traceId, // Client can give this to support
      message: isProduction && status >= 500 ? 'An unexpected error occurred. Please contact support with trace ID.' : errorResponse.message || errorResponse,
    };

    // Include detailed validation errors if they exist
    if (errorResponse.message && Array.isArray(errorResponse.message)) {
      finalResponse.message = errorResponse.message;
    }

    response.status(status).json(finalResponse);
  }
}
