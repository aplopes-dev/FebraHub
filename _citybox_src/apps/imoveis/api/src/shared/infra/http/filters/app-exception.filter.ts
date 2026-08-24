import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../../core/errors/app.error';
import { DomainError } from '../../../core/errors/domain.error';
import { InfrastructureError } from '../../../core/errors/infrastructure.error';
import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';

@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `[${exception.context}] ${exception.internalMessage}`,
      exception.stack,
    );

    const status = this.resolveStatus(exception);

    response.status(status).json({
      error: {
        code: exception.name,
        message: exception.externalMessage,
      },
    });
  }

  private resolveStatus(error: AppError): number {
    if (error instanceof ValidatorDomainError)
      return HttpStatus.UNPROCESSABLE_ENTITY;
    if (error instanceof DomainError) {
      if (error.name.includes('NotFound')) return HttpStatus.NOT_FOUND;
      if (error.name.includes('ImmutableField')) return HttpStatus.BAD_REQUEST;
      if (
        error.name.includes('EmailTaken') ||
        error.name.includes('DocumentTaken') ||
        error.name.includes('SlugTaken') ||
        error.name.includes('Duplicate') ||
        error.name.includes('AlreadyExists') ||
        error.name.includes('AlreadyHas') ||
        error.name.includes('Unavailable')
      )
        return HttpStatus.CONFLICT;
      if (error.name.includes('Forbidden')) return HttpStatus.FORBIDDEN;
      if (error.name.includes('Unauthorized')) return HttpStatus.UNAUTHORIZED;
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    if (error instanceof InfrastructureError) {
      if (error.name.includes('Unavailable'))
        return HttpStatus.SERVICE_UNAVAILABLE;
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
