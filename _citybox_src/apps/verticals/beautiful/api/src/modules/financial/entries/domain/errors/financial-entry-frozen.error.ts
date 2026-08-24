import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialEntryFrozenError extends DomainError {
  constructor(
    context: string,
    entryId: string,
    reason: 'paid' | 'received' | 'cancelled' | 'pending' | 'invalid_type',
  ) {
    const messages: Record<typeof reason, string> = {
      paid: 'Lançamento pago não pode ser alterado',
      received: 'Lançamento recebido não pode ser alterado',
      cancelled: 'Lançamento já cancelado',
      pending: 'Lançamento ainda não liquidado — nada a cancelar',
      invalid_type: 'Operação inválida para o tipo do lançamento',
    };
    super({
      internalMessage: `Financial entry cannot be modified: ${entryId} (${reason})`,
      externalMessage: messages[reason],
      context,
    });
  }
}
