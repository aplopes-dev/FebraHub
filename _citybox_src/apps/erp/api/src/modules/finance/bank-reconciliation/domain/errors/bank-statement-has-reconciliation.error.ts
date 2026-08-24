import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * FR-045 (decisão de 2026-08-14) — tentativa de excluir um extrato que ainda
 * tem transação conciliada.
 *
 * Mesma filosofia da FR-019 (excluir transação): nada de desfazer escondido
 * dentro de um botão de excluir. Uma conciliação ativa alterou saldo de conta
 * bancária e status de lançamento — desfazer isso precisa ser um passo
 * explícito do operador, não efeito colateral. Comportamento confirmado no
 * CPLUG: excluir é recusado enquanto há item conciliado, e liberado depois de
 * desconciliar.
 */
export class BankStatementHasReconciliationError extends DomainError {
  constructor(reconciledCount: number) {
    super({
      internalMessage: `Bank statement still has ${reconciledCount} reconciled transaction(s)`,
      externalMessage:
        'Desfaça as conciliações deste extrato antes de excluí-lo',
      context: BankStatementHasReconciliationError.name,
    });
  }
}
