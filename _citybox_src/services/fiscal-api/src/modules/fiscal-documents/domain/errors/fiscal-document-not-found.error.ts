import { DomainError } from '../../../../shared/core/errors/domain.error';

export class FiscalDocumentNotFoundError extends DomainError {
  constructor(context: string, fiscalDocumentId: string) {
    super({
      internalMessage: `FiscalDocument "${fiscalDocumentId}" not found`,
      externalMessage: 'Documento fiscal não encontrado',
      context,
    });
  }
}
