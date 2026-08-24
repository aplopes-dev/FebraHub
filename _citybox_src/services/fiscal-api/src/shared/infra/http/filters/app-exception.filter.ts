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
        // `externalCode` cai no nome da classe por padrão; só difere quando o
        // código é definido por um órgão externo (ex.: rejeições `E####` do
        // Sistema Nacional da NFS-e), caso em que quem consome precisa do
        // código oficial para agir.
        code: exception.externalCode,
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
        error.name.includes('Taken') ||
        error.name.includes('Duplicate') ||
        error.name.includes('AlreadyExists') ||
        error.name.includes('Overlap') ||
        error.name.includes('Conflict')
      )
        return HttpStatus.CONFLICT;
      if (error.name.includes('Forbidden')) return HttpStatus.FORBIDDEN;
      if (error.name.includes('Unauthorized')) return HttpStatus.UNAUTHORIZED;
      if (error.name.includes('NotConfigured'))
        return HttpStatus.FAILED_DEPENDENCY;
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    if (error instanceof InfrastructureError) {
      if (error.name.includes('Unavailable'))
        return HttpStatus.SERVICE_UNAVAILABLE;
      // Integração deliberadamente ausente (ex.: NFS-e Ilhéus, cujo protocolo
      // municipal segue sem confirmação) não é falha inesperada — 500 poluiria
      // o alarme de erro com uma condição conhecida e estável.
      if (error.name.includes('NotImplemented'))
        return HttpStatus.NOT_IMPLEMENTED;
      if (error.name.includes('NotConfigured'))
        return HttpStatus.FAILED_DEPENDENCY;
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
