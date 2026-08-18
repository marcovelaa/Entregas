import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      let body = exception.getResponse();

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        body = {
          statusCode: status,
          message: 'Demasiadas peticiones. Por favor, intentá de nuevo más tarde.',
          error: 'Too Many Requests'
        };
      }

      return response.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
    }

    this.logger.error(
      `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error inesperado.',
    });
  }
}
