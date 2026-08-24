import { DomainError } from '../../../../shared/core/errors/domain.error';

export class GeneratedDocumentNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Generated document not found: id=${id}`,
      externalMessage: 'Documento gerado não encontrado.',
      context: 'GeneratedDocumentNotFoundError',
    });
  }
}
