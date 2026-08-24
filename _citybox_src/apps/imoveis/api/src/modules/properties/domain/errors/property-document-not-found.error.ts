import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PropertyDocumentNotFoundError extends DomainError {
  constructor(context: string, documentId: string) {
    super({
      internalMessage: `Property document not found: ${documentId}`,
      externalMessage: 'Documento do imóvel não encontrado',
      context,
    });
  }
}
