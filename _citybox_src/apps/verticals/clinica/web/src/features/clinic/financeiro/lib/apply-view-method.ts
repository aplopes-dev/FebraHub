import type { TransactionsFilters, TransactionsViewMode } from "../types";

/**
 * Ação VER: troca para visão Transações filtrada pelo meio de pagamento.
 */
export function applyViewMethod(
  filters: TransactionsFilters,
  method: string,
): { viewMode: TransactionsViewMode; filters: TransactionsFilters } {
  return {
    viewMode: "transactions",
    filters: {
      ...filters,
      paymentMethods: [method],
    },
  };
}
