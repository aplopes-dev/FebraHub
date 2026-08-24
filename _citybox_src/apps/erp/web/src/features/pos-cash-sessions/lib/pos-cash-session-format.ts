export function formatCurrencyBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Código amigável da venda para UI (`#42`).
 * Sem número válido, cai no legado mock `sale-NNNN` ou no id bruto.
 */
export function formatPosCashSaleCode(
  sale: { number?: number; id: string } | string,
): string {
  if (typeof sale === "string") {
    const match = /^sale-(\d+)$/i.exec(sale.trim());
    if (match) return `#${match[1]}`;
    return sale;
  }
  if (typeof sale.number === "number" && sale.number > 0) {
    return `#${sale.number}`;
  }
  const match = /^sale-(\d+)$/i.exec(sale.id.trim());
  if (match) return `#${match[1]}`;
  return sale.id;
}

export function formatDateTimeBR(iso: string | null): string {
  if (!iso) return "Aberto";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDateTimeOrOpen(iso: string | null): string {
  if (!iso) return "Ainda aberto";
  return formatDateTimeBR(iso);
}
