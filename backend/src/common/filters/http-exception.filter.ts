import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.error(
      `Status ${status}: ${exception.message}`,
      exception.stack,
    );

    const error = typeof exceptionResponse === 'string'
      ? { statusCode: status, message: exceptionResponse, error: exceptionResponse }
      : { statusCode: status, ...(exceptionResponse as object) };

    response.status(status).json(error);
  }
}