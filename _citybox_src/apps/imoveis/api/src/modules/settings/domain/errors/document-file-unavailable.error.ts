import { DomainError } from '../../../../shared/core/errors/domain.error';

/** Registro só com metadados (sem `objectKey`) — não há arquivo para baixar. */
export class DocumentFileUnavailableError extends DomainError {
  constructor(context: string, documentId: string) {
    super({
      internalMessage: `Document has no stored file: ${documentId}`,
      externalMessage: 'Arquivo indisponível para este documento',
      context,
    });
  }
}
