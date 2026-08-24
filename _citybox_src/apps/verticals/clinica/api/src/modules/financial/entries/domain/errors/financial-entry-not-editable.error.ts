import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialEntryNotEditableError extends DomainError {
  constructor(context: string, entryId: string) {
    super({
      internalMessage: `Financial entry is not editable: ${entryId}`,
      externalMessage:
        'Somente lançamentos manuais pendentes podem ser editados',
      context,
    });
  }
}
