export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** ISO `yyyy-MM-dd` → `dd/MM/yyyy` ("—" quando vazio). */
export function formatIsoDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

import {
  FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS,
  type FinancialEntryPayment,
} from "@/features/financial-entries/types/financial-entry";

/**
 * Rótulo de "Método de pagamento" para exibição em grade (Extrato,
 * `007-financeiro-ajustes-ui` FR-003) — 0 pagamentos → "—", 1 → o rótulo
 * dele, 2+ → "Múltiplas formas" (mesmo padrão de `categoryLabel` para
 * múltiplas categorias). Usa fallback pro id cru quando ele não bate com
 * nenhum rótulo conhecido (US3 troca a origem do id para o cadastro real de
 * formas de pagamento — o enum fixo atual deixa de cobrir todos os casos).
 */
export function resolvePaymentMethodLabel(
  payments: FinancialEntryPayment[],
): string {
  if (payments.length === 0) return "—";
  if (payments.length > 1) return "Múltiplas formas";

  const [payment] = payments;
  const label =
    FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS[
      payment.paymentMethodId as keyof typeof FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS
    ];
  return label ?? (payment.paymentMethodId || "—");
}

/** Bytes → `"120 KB"`/`"3,4 MB"` (uma casa decimal, pt-BR). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}
