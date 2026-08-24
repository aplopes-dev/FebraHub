export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** ISO `yyyy-MM-dd` → `dd/MM/yyyy`. */
export function formatIsoDateBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export const BANK_STATEMENT_STATUS_LABELS = {
  not_reconciled: "Não conciliado",
  partially_reconciled: "Parcialmente conciliado",
  reconciled: "Conciliado",
} as const;

export const BANK_STATEMENT_TRANSACTION_TAB_LABELS = {
  pending: "Pendentes",
  reconciled: "Conciliadas",
  discarded: "Excluídas",
} as const;

/** Entrada em verde, saída em vermelho (RN-07). */
export function bankStatementTransactionColor(
  kind: "credit" | "debit",
): "success.main" | "error.main" {
  return kind === "credit" ? "success.main" : "error.main";
}

export function bankStatementTransactionSign(kind: "credit" | "debit"): "+" | "-" {
  return kind === "credit" ? "+" : "-";
}
