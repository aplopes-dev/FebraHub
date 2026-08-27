import type {
  FinancialResultPeriod,
  FinancialResultPeriodPreset,
} from "@/features/financial-results/types/financial-result";

export const FINANCIAL_RESULT_PERIOD_ORDER: FinancialResultPeriodPreset[] = [
  "current_month",
  "last_month",
  "last_3_months",
  "current_year",
  "custom",
];

export const FINANCIAL_RESULT_PERIOD_LABELS: Record<
  FinancialResultPeriodPreset,
  string
> = {
  current_month: "Mês atual",
  last_month: "Mês passado",
  last_3_months: "Últimos 3 meses",
  current_year: "Ano atual",
  custom: "Período personalizado",
};

export type FinancialResultDateRange = {
  from: Date;
  to: Date;
};

export function createDefaultFinancialResultPeriod(): FinancialResultPeriod {
  return {
    preset: "current_month",
    customFrom: null,
    customTo: null,
  };
}

export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date, monthOffset = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function endOfMonth(date: Date, monthOffset = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);
}

/** Intervalo inclusivo de dia civil local; `null` quando o custom está incompleto. */
export function resolveFinancialResultPeriodRange(
  period: FinancialResultPeriod,
  now: Date = new Date(),
): FinancialResultDateRange | null {
  switch (period.preset) {
    case "current_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month":
      return { from: startOfMonth(now, -1), to: endOfMonth(now, -1) };
    case "last_3_months":
      return { from: startOfMonth(now, -2), to: endOfMonth(now) };
    case "current_year":
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31),
      };
    case "custom": {
      const fromDate = period.customFrom
        ? parseIsoDate(period.customFrom)
        : null;
      const toDate = period.customTo ? parseIsoDate(period.customTo) : null;
      if (!fromDate && !toDate) return null;
      const from = startOfDay(fromDate ?? toDate!);
      const to = startOfDay(toDate ?? fromDate!);
      return from.getTime() <= to.getTime()
        ? { from, to }
        : { from: to, to: from };
    }
    default:
      return null;
  }
}
