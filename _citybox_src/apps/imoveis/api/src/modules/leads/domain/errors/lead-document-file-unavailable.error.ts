import { DomainError } from '../../../../shared/core/errors/domain.error';

export class LeadDocumentFileUnavailableError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Lead document has no object key: ${id}`,
      externalMessage: 'Este documento ainda não tem arquivo para visualizar.',
      context,
    });
  }
}
