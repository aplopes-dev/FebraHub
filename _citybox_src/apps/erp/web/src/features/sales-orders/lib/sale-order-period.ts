import type {
  SaleOrderPeriod,
  SaleOrderPeriodPreset,
} from "@/features/sales-orders/types/sale-order";

export const SALE_ORDER_PERIOD_ORDER: SaleOrderPeriodPreset[] = [
  "all",
  "today",
  "yesterday",
  "last_7_days",
  "last_2_weeks",
  "last_30_days",
  "custom",
];

export const SALE_ORDER_PERIOD_LABELS: Record<SaleOrderPeriodPreset, string> = {
  all: "Todos",
  today: "Hoje",
  yesterday: "Ontem",
  last_7_days: "Últimos 7 dias",
  last_2_weeks: "Últimas 2 semanas",
  last_30_days: "Últimos 30 dias",
  custom: "Data específica",
};

export function createDefaultSaleOrderPeriod(): SaleOrderPeriod {
  return {
    preset: "all",
    customFrom: null,
    customTo: null,
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export type SaleOrderDateRange = {
  from: Date;
  to: Date;
};

/**
 * Resolve o período em intervalo inclusivo de dia civil local.
 * Retorna `null` quando não há filtro (Todos) ou quando custom está incompleto.
 */
export function resolveSaleOrderPeriodRange(
  period: SaleOrderPeriod,
  now: Date = new Date(),
): SaleOrderDateRange | null {
  const today = startOfDay(now);

  switch (period.preset) {
    case "all":
      return null;
    case "today":
      return { from: today, to: endOfDay(today) };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }
    case "last_7_days":
      return { from: addDays(today, -6), to: endOfDay(today) };
    case "last_2_weeks":
      return { from: addDays(today, -13), to: endOfDay(today) };
    case "last_30_days":
      return { from: addDays(today, -29), to: endOfDay(today) };
    case "custom": {
      const fromDate = period.customFrom
        ? parseIsoDate(period.customFrom)
        : null;
      const toDate = period.customTo ? parseIsoDate(period.customTo) : null;
      if (!fromDate && !toDate) return null;
      const from = startOfDay(fromDate ?? toDate!);
      const to = endOfDay(toDate ?? fromDate!);
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: startOfDay(to), to: endOfDay(from) };
    }
    default:
      return null;
  }
}

export function isCreatedAtInPeriod(
  createdAt: string,
  period: SaleOrderPeriod,
  now: Date = new Date(),
): boolean {
  const range = resolveSaleOrderPeriodRange(period, now);
  if (!range) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() >= range.from.getTime() &&
    created.getTime() <= range.to.getTime();
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
