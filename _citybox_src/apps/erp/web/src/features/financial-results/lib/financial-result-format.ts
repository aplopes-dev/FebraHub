export function formatResultCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Grupo de sinal negativo sai com `-` para leitura contábil (ex.: `- R$ 100,00`). */
export function formatResultAmount(
  value: number,
  sign: "positive" | "negative",
): string {
  const formatted = formatResultCurrency(Math.abs(value));
  return sign === "negative" ? `- ${formatted}` : formatted;
}

/** Resultado do período: negativo explícito, positivo sem sinal. */
export function formatResultNet(value: number): string {
  const formatted = formatResultCurrency(Math.abs(value));
  return value < 0 ? `- ${formatted}` : formatted;
}

/** Usado por `features/cost-center-analysis` (percentual de participação). */
export function formatResultShare(share: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(share * 100)}%`;
}

export function formatResultDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
