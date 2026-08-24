import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AgentFolderDocumentNotFoundError extends DomainError {
  constructor(context: string, documentId: string) {
    super({
      internalMessage: `Agent folder document not found: ${documentId}`,
      externalMessage: 'Documento não encontrado',
      context,
    });
  }
}
