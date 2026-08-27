import type {
  ServiceOrder,
  ServiceOrderLine,
} from "@/features/service-orders/types/service-order";

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Total de uma linha: qtde × valor unitário − desconto (nunca negativo). */
export function computeLineTotal(line: ServiceOrderLine): number {
  return roundCurrency(
    Math.max(0, line.quantity * line.unitPrice - line.discount),
  );
}

export function sumLinesByKind(
  lines: readonly ServiceOrderLine[],
  kind: ServiceOrderLine["kind"],
): number {
  return roundCurrency(
    lines
      .filter((line) => line.kind === kind)
      .reduce((acc, line) => acc + computeLineTotal(line), 0),
  );
}

/** Total da OS = soma de todas as linhas (serviços + produtos). */
export function computeServiceOrderTotal(
  lines: readonly ServiceOrderLine[],
): number {
  return roundCurrency(
    lines.reduce((acc, line) => acc + computeLineTotal(line), 0),
  );
}

export function computeOrderTotal(order: ServiceOrder): number {
  return computeServiceOrderTotal(order.lines);
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formata o prazo/abertura (`dd/MM/yyyy HH:mm`) a partir de ISO datetime. */
export function formatDateTimeBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/** Prazo estourado: dueAt no passado e a OS ainda não está fechada/cancelada. */
export function isOverdue(
  dueAt: string | null,
  isFinished: boolean,
  now = new Date(),
): boolean {
  if (!dueAt || isFinished) return false;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < now.getTime();
}
