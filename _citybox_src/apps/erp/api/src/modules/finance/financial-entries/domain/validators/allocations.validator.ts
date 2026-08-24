import { AllocationMismatchError } from '../errors/allocation-mismatch.error';
import { sumFinancialEntryAllocations } from '../entities/financial-entry-allocation.entity';
import type { FinancialEntryAllocation } from '../entities/financial-entry-allocation.entity';

/** Tolerância de arredondamento — R$ 0,01. */
const ALLOCATION_TOLERANCE_CENTS = 1;

/**
 * Confere que o rateio por categoria fecha com o valor total do lançamento
 * antes de gravar.
 *
 * Lista vazia com total > 0 é recusada de propósito (edge case do spec): um
 * lançamento sem nenhuma linha de rateio não alimentaria a DRE em lugar
 * nenhum, silenciosamente. A tolerância de 1 centavo absorve arredondamento
 * de percentual sem abrir brecha para uma diferença real de valor.
 */
export function assertAllocationsMatchTotal(
  allocations: readonly FinancialEntryAllocation[],
  totalCents: number,
): void {
  if (totalCents <= 0) return;

  const allocatedCents = sumFinancialEntryAllocations(allocations);
  const diff = Math.abs(totalCents - allocatedCents);

  if (allocations.length === 0 || diff > ALLOCATION_TOLERANCE_CENTS) {
    throw new AllocationMismatchError(totalCents, allocatedCents);
  }
}
