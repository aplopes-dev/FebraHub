import type {
  RecurrenceDuration,
  RecurrenceFrequency,
  SalesContract,
} from "@/features/sales-contracts/types/sales-contract";

function parseParts(iso: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (y == null || m == null || d == null) return null;
  return { y, m, d };
}

function toIso(y: number, m: number, d: number): string {
  const date = new Date(y, m - 1, d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Adiciona um passo de frequência a uma data ISO local. */
export function addFrequencyStep(
  isoDate: string,
  frequency: RecurrenceFrequency,
  steps = 1,
): string {
  const parts = parseParts(isoDate);
  if (!parts) return isoDate;

  let { y, m, d } = parts;
  for (let i = 0; i < steps; i += 1) {
    switch (frequency) {
      case "weekly":
        {
          const date = new Date(y, m - 1, d);
          date.setDate(date.getDate() + 7);
          y = date.getFullYear();
          m = date.getMonth() + 1;
          d = date.getDate();
        }
        break;
      case "biweekly":
        {
          const date = new Date(y, m - 1, d);
          date.setDate(date.getDate() + 14);
          y = date.getFullYear();
          m = date.getMonth() + 1;
          d = date.getDate();
        }
        break;
      case "monthly":
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
        break;
      case "quarterly":
        m += 3;
        while (m > 12) {
          m -= 12;
          y += 1;
        }
        break;
      case "yearly":
        y += 1;
        break;
    }
  }

  // Clamp day for shorter months
  const lastDay = new Date(y, m, 0).getDate();
  return toIso(y, m, Math.min(d, lastDay));
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

const FOREVER_PREVIEW_COUNT = 12;

/**
 * Calcula as datas de vencimento a partir da recorrência do contrato.
 * Em modo "forever", gera um horizonte de preview (12 parcelas).
 */
export function computeInstallmentDueDates(
  firstDueDate: string,
  frequency: RecurrenceFrequency,
  duration: RecurrenceDuration,
): string[] {
  const dates: string[] = [];
  let current = firstDueDate;

  if (duration.mode === "times") {
    const times = Math.max(1, Math.floor(duration.times));
    for (let i = 0; i < times; i += 1) {
      dates.push(current);
      current = addFrequencyStep(current, frequency);
    }
    return dates;
  }

  if (duration.mode === "until_date") {
    while (compareIsoDates(current, duration.untilDate) <= 0) {
      dates.push(current);
      current = addFrequencyStep(current, frequency);
      if (dates.length > 120) break;
    }
    return dates;
  }

  for (let i = 0; i < FOREVER_PREVIEW_COUNT; i += 1) {
    dates.push(current);
    current = addFrequencyStep(current, frequency);
  }
  return dates;
}

export function computeContractTotal(
  items: SalesContract["items"],
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
}
