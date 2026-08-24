import type { TransactionEntity } from '../../../transactions/domain/entities/transaction.entity';

export type OrganizationType = 'AGENCY' | 'SINGLE_AGENT';

/**
 * Receita bruta no mesmo critério de `GetFinancialSummaryUseCase`:
 * - AGENCY: Σ `grossValueCents` com status ≠ CANCELLED
 * - SINGLE_AGENT: Σ `split.totalCommissionCents` com status COMPLETED
 *   (opcionalmente restrito a captor/seller = `actorAgentId`)
 */
export function computeGrossRevenueCents(
  transactions: readonly TransactionEntity[],
  organizationType: OrganizationType,
  actorAgentId?: string,
): number {
  if (organizationType === 'SINGLE_AGENT') {
    const scoped = actorAgentId
      ? transactions.filter(
          (tx) => tx.captorId === actorAgentId || tx.sellerId === actorAgentId,
        )
      : transactions;
    return scoped
      .filter((tx) => tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.split.totalCommissionCents, 0);
  }

  return transactions
    .filter((tx) => tx.status !== 'CANCELLED')
    .reduce((sum, tx) => sum + tx.grossValueCents, 0);
}
