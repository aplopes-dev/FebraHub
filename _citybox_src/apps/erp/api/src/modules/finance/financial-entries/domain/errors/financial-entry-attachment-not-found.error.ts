import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialEntryAttachmentNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry attachment ${id} not found in the current organization`,
      externalMessage: 'Anexo não encontrado',
      context: FinancialEntryAttachmentNotFoundError.name,
    });
  }
}
