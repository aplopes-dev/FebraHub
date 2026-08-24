import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialEntryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry ${id} not found in the current organization`,
      externalMessage: 'Lançamento financeiro não encontrado',
      context: FinancialEntryNotFoundError.name,
    });
  }
}
