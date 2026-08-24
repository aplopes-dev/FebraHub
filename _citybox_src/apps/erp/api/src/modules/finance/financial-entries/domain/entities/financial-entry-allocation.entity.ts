import { randomUUID } from 'crypto';
import type { Optional } from '../../../../../shared/core/types/optional.type';

/**
 * Uma linha de rateio por categoria financeira — fatia do valor total de um
 * lançamento atribuída a uma conta do plano de contas + um centro de custo
 * (obrigatório, FR-010). Value object embutido no lançamento: substituído por
 * completo a cada `save()`, mesmo raciocínio de `FinancialEntryPayment`.
 */
export type FinancialEntryAllocation = {
  id: string;
  chartOfAccountId: string;
  costCenterId: string;
  amountCents: number;
  /** Percentual equivalente a `amountCents / totalCents * 100`. */
  percentage: number;
};

export type FinancialEntryAllocationInput = Optional<
  FinancialEntryAllocation,
  'id'
>;

export function normalizeFinancialEntryAllocations(
  allocations: FinancialEntryAllocationInput[] | undefined,
): FinancialEntryAllocation[] {
  return (allocations ?? []).map((allocation) => ({
    id: allocation.id ?? randomUUID(),
    chartOfAccountId: allocation.chartOfAccountId,
    costCenterId: allocation.costCenterId,
    amountCents: allocation.amountCents,
    percentage: allocation.percentage,
  }));
}

export function sumFinancialEntryAllocations(
  allocations: readonly FinancialEntryAllocation[],
): number {
  return allocations.reduce(
    (sum, allocation) => sum + allocation.amountCents,
    0,
  );
}
