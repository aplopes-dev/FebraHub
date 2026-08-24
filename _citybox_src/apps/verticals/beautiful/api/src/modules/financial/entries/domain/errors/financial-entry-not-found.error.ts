import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialEntryNotFoundError extends DomainError {
  constructor(context: string, entryId: string) {
    super({
      internalMessage: `Financial entry not found: ${entryId}`,
      externalMessage: 'Lançamento financeiro não encontrado',
      context,
    });
  }
}
