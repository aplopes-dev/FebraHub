export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "check", label: "Cheque" },
] as const;

/** Badge colors (bg + text + border) por meio de pagamento. */
export const PAYMENT_METHOD_BADGE_CLASS: Record<string, string> = {
  cash: "border-emerald-200 bg-emerald-50 text-emerald-800",
  credit: "border-violet-200 bg-violet-50 text-violet-800",
  debit: "border-indigo-200 bg-indigo-50 text-indigo-800",
  pix: "border-sky-200 bg-sky-50 text-sky-800",
  transfer: "border-amber-200 bg-amber-50 text-amber-900",
  boleto: "border-orange-200 bg-orange-50 text-orange-800",
  check: "border-slate-200 bg-slate-100 text-slate-800",
};

const FALLBACK_BADGE_CLASS = "border-border bg-muted text-muted-foreground";

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  const found = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found?.label ?? method;
}

export function paymentMethodBadgeClass(
  method: string | null | undefined,
): string {
  if (!method) return FALLBACK_BADGE_CLASS;
  return PAYMENT_METHOD_BADGE_CLASS[method] ?? FALLBACK_BADGE_CLASS;
}
