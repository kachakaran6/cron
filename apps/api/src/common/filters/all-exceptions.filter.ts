import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : {
          statusCode: status,
          message: exception.message || 'Internal server error',
          detail: exception.detail || exception.code || null,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

    this.logger.error(
      `HTTP ${status} on ${request.method} ${request.url}: ${exception?.message || exception}`,
      exception?.stack
    );

    response.status(status).json(message);
  }
}
