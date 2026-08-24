import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientFinancialEntryNotFoundError extends DomainError {
  constructor(context: string, entryId: string) {
    super({
      internalMessage: `Patient financial entry not found: ${entryId}`,
      externalMessage: 'Lançamento financeiro não encontrado',
      context,
    });
  }
}
