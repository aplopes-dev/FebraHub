import { DomainError } from '../../../../shared/core/errors/domain.error';

export class LeadDocumentNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Lead document not found: id=${id}`,
      externalMessage: 'Documento do lead não encontrado.',
      context: 'LeadDocumentNotFoundError',
    });
  }
}
