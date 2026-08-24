/** Formata centavos para exibição mascarada (ex: 29900 → "299,00"). */
export function formatPriceDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte valor mascarado pt-BR para número em reais (ex: "R$ 2.990,00" → 2990). */
export function parsePriceDisplay(value: string): number {
  const cleaned = value
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/** Alias nativo do use-mask-input para moeda BRL. */
export const PRICE_MASK = "brl-currency" as const;

export const PRICE_MASK_OPTIONS = {
  autoUnmask: false,
  placeholder: "0,00",
  numericInput: true,
  digits: 2,
  digitsOptional: false,
  enforceDigitsOnBlur: true,
} as const;
