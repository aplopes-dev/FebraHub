import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * `specs/erp/007-financeiro-ajustes-ui` US10/FR-006e — lançamento com um
 * pagamento em conciliação bancária ativa não pode ser excluído (soft-delete)
 * antes de desfazer a conciliação. Nome com sufixo "NotRemovable" para o
 * `app-exception.filter.ts` mapear para 409 automaticamente (mesmo mecanismo
 * de `PaymentMethodNotRemovableError`).
 */
export class FinancialEntryNotRemovableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry ${id} has an active bank reconciliation match and cannot be deleted`,
      externalMessage:
        'Não é possível excluir: este lançamento tem um pagamento conciliado. Desfaça a conciliação antes de excluir.',
      context: FinancialEntryNotRemovableError.name,
    });
  }
}
