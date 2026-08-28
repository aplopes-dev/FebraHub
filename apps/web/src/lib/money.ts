/**
 * Dinheiro em centavos — inteiro, nunca float.
 *
 * O comercial da Febracis trabalha com preço de tabela, desconto e valor
 * praticado no mesmo cálculo; guardar em reais com casa decimal faz o desconto
 * de 33,33% virar centavo perdido. Todo valor de domínio anda em centavos e só
 * vira texto na borda da tela.
 */

/** `499700` → `"R$ 4.997,00"`. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** `499700` → `"R$ 5,0 mil"`; `1250000` → `"R$ 12,5 mil"`. Para cards de KPI. */
export function formatCentsCompact(cents: number): string {
  const reais = cents / 100;
  if (Math.abs(reais) >= 1_000_000) {
    return `R$ ${(reais / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  }
  if (Math.abs(reais) >= 1_000) {
    return `R$ ${(reais / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return formatCents(cents);
}

/** Percentual de desconto entre tabela e praticado, arredondado a 1 casa. */
export function discountPercent(listCents: number, netCents: number): number {
  if (listCents <= 0) return 0;
  return Math.round(((listCents - netCents) / listCents) * 1000) / 10;
}

/** `12,5` → `"12,5%"`. */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })}%`;
}
