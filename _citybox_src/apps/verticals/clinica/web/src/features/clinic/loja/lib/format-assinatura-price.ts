/** Formata valor em reais no padrão pt-BR (ex.: 99.9 → "99,90"). */
export function formatAssinaturaPrice(priceReais: number): string {
  return priceReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
