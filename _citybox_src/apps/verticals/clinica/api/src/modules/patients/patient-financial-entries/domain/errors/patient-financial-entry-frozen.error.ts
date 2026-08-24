import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientFinancialEntryFrozenError extends DomainError {
  constructor(
    context: string,
    entryId: string,
    reason: 'received' | 'not_editable',
  ) {
    super({
      internalMessage: `Patient financial entry cannot be modified: ${entryId} (${reason})`,
      externalMessage:
        reason === 'received'
          ? 'Lançamento recebido não pode ser alterado'
          : 'Somente débitos pendentes podem ser editados',
      context,
    });
  }
}
