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
        error.name.includes('UsernameTaken') ||
        error.name.includes('IdentityTaken') ||
        error.name.includes('DocumentTaken') ||
        error.name.includes('SlugTaken') ||
        error.name.includes('NameTaken') ||
        error.name.includes('IsDefault') ||
        error.name.includes('Duplicate') ||
        error.name.includes('BlockedForStore') ||
        error.name.includes('Frozen') ||
        error.name.includes('NotEditable') ||
        error.name.includes('Completed') ||
        error.name.includes('Confirmed') ||
        error.name.includes('AlreadySubmitted') ||
        error.name.includes('SlotTaken') ||
        error.name.includes('Overlaps') ||
        error.name.includes('HasAppointments') ||
        error.name.includes('HasPatients') ||
        error.name.includes('TreatmentsInUse') ||
        error.name.includes('HasOpportunities') ||
        error.name.includes('LinkedToCommission')
      )
        return HttpStatus.CONFLICT;
      if (error.name.includes('Expired')) return HttpStatus.GONE;
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
