"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Download } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DateRangePickerInput } from "@citybox/ui/molecules";
import type { DateRange } from "@citybox/ui/molecules";

type DashboardPeriodPreset =
  | "hoje"
  | "esta-semana"
  | "este-mes"
  | "este-semestre"
  | "data-especifica";

const PERIOD_OPTIONS: { value: DashboardPeriodPreset; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "esta-semana", label: "Esta semana" },
  { value: "este-mes", label: "Este mês" },
  { value: "este-semestre", label: "Este Semestre" },
  { value: "data-especifica", label: "Data específica" },
];

const PERIOD_FIELD_CLASS =
  "h-9 rounded-xl border-border/50 bg-background shadow-none";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDatesForPreset(preset: DashboardPeriodPreset): { from?: Date; to?: Date } {
  const now = new Date();
  switch (preset) {
    case "hoje": {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from, to };
    }
    case "esta-semana": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
      const from = new Date(now.setDate(diff));
      from.setHours(0, 0, 0, 0);
      const to = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999);
      return { from, to };
    }
    case "este-mes": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case "este-semestre": {
      const currentMonth = now.getMonth();
      const startMonth = currentMonth < 6 ? 0 : 6;
      const from = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), startMonth + 6, 0, 23, 59, 59, 999);
      return { from, to };
    }
    default:
      return {};
  }
}

export function FinancialDashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = (searchParams.get("period") as DashboardPeriodPreset) || "este-mes";
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");

  useEffect(() => {
    if (!startDateStr || !endDateStr) {
      const params = new URLSearchParams(searchParams.toString());
      if (!searchParams.get("period")) {
        params.set("period", "este-mes");
      }
      const dates = getDatesForPreset(period);
      if (dates.from && dates.to) {
        params.set("startDate", formatLocalDate(dates.from));
        params.set("endDate", formatLocalDate(dates.to));
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [startDateStr, endDateStr, period, pathname, router, searchParams]);

  const dateRange: DateRange | undefined = startDateStr && endDateStr
    ? { from: parseLocalDate(startDateStr), to: parseLocalDate(endDateStr) }
    : undefined;

  function handlePeriodChange(value: string) {
    const preset = value as DashboardPeriodPreset;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", preset);

    if (preset !== "data-especifica") {
      const dates = getDatesForPreset(preset);
      if (dates.from && dates.to) {
        params.set("startDate", formatLocalDate(dates.from));
        params.set("endDate", formatLocalDate(dates.to));
      } else {
        params.delete("startDate");
        params.delete("endDate");
      }
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) {
      params.set("startDate", formatLocalDate(range.from));
    } else {
      params.delete("startDate");
    }
    if (range?.to) {
      params.set("endDate", formatLocalDate(range.to));
    } else {
      params.delete("endDate");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--orbitly-ink)]">
          Financeiro
        </h1>
        <p className="mt-0.5 text-sm text-foreground/55">
          Visão geral da saúde financeira da plataforma
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger
            className={`w-[172px] ${PERIOD_FIELD_CLASS}`}
          >
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {period === "data-especifica" ? (
          <DateRangePickerInput
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder="Selecionar período"
            className={`w-[260px] ${PERIOD_FIELD_CLASS}`}
            numberOfMonths={2}
          />
        ) : null}

        <Button className="h-9 gap-2 rounded-xl shadow-none">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>
  );
}
