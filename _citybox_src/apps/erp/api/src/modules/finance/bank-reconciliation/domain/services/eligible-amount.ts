import type { FinancialEntry } from '../../../financial-entries/domain/entities/financial-entry.entity';

/**
 * Valor elegível de um lançamento para conciliação (research.md D16):
 * `pending` → saldo em aberto (`amountCents - paidCents`), o valor que um
 * `addPayment` novo cobriria; `paid` → `amountCents` total (assume
 * pagamento único, D16 — o vínculo aponta para esse pagamento já existente,
 * sem criar um novo). Usado tanto por `reconcile-transaction` (validação de
 * soma) quanto por `search-eligible-entries` (exibição/soma na UI).
 */
export function calculateEligibleAmountCents(entry: FinancialEntry): number {
  return entry.status === 'paid'
    ? entry.amountCents
    : entry.amountCents - entry.paidCents;
}
