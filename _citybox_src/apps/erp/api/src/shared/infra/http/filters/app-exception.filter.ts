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
      // `Taken` genérico (não só Email/Document/Slug): qualquer "já existe"
      // é conflito. A versão da food/api listava os sufixos um a um e deixava
      // `ProductSkuTakenError` cair no 422 — ver AGENTS.md §5.6.
      if (
        error.name.includes('Taken') ||
        error.name.includes('Duplicate') ||
        error.name.includes('BlockedForStore') ||
        error.name.includes('InUse') ||
        error.name.includes('NotRemovable') ||
        error.name.includes('InsufficientStock') ||
        error.name.includes('AlreadySold') ||
        error.name.includes('ImmutableAfterSale') ||
        error.name.includes('InvalidStatusTransition')
      )
        return HttpStatus.CONFLICT;
      if (error.name.includes('Forbidden')) return HttpStatus.FORBIDDEN;
      // 423 Locked: o recurso existe e a credencial pode até estar certa, mas
      // o acesso está suspenso por tempo. Distinto de 401 (credencial errada)
      // e de 403 (papel não permite).
      if (error.name.includes('Locked')) return HttpStatus.LOCKED;
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
