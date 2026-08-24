import type { FinancialEntry, PaymentMethodSummary } from "../types";

/**
 * Agrupa lançamentos por meio de pagamento.
 * Ignora cancelados e entradas sem `paymentMethod`.
 * Omite linhas com receitas e despesas zeradas.
 */
export function aggregateByPaymentMethod(
  entries: FinancialEntry[],
): PaymentMethodSummary[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const entry of entries) {
    if (entry.status === "cancelled") continue;
    const method = entry.paymentMethod;
    if (!method) continue;

    const current = map.get(method) ?? { income: 0, expense: 0 };
    if (entry.type === "income") {
      map.set(method, { ...current, income: current.income + entry.value });
    } else {
      map.set(method, { ...current, expense: current.expense + entry.value });
    }
  }

  return [...map.entries()]
    .map(([method, totals]) => ({
      method,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    }))
    .filter((row) => row.income > 0 || row.expense > 0)
    .sort((a, b) => a.method.localeCompare(b.method));
}
