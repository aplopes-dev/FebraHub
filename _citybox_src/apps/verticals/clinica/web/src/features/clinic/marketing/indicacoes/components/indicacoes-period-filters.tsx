'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import {
  DASHBOARD_MONTH_OPTIONS,
  DEFAULT_DASHBOARD_FINANCIAL_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR,
} from '@/features/clinic/modules/dashboard/lib/dashboard-financial';
import type { IndicacoesPeriodMode } from '../types/indicacoes';

type IndicacoesPeriodFiltersProps = {
  mode: IndicacoesPeriodMode;
  month: number;
  year: number;
  years: number[];
  onModeChange: (mode: IndicacoesPeriodMode) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

function isPeriodMode(value: string): value is IndicacoesPeriodMode {
  return value === 'annual' || value === 'monthly';
}

export function IndicacoesPeriodFilters({
  mode,
  month,
  year,
  years,
  onModeChange,
  onMonthChange,
  onYearChange,
}: IndicacoesPeriodFiltersProps) {
  const yearOptions =
    years.length > 0 ? years : [DEFAULT_DASHBOARD_FINANCIAL_YEAR];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={mode}
        onValueChange={(value) => {
          if (isPeriodMode(value)) onModeChange(value);
        }}
      >
        <SelectTrigger className="w-28" aria-label="Modo do período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="annual">Anual</SelectItem>
          <SelectItem value="monthly">Mensal</SelectItem>
        </SelectContent>
      </Select>

      {mode === 'monthly' ? (
        <Select
          value={String(month)}
          onValueChange={(value) => onMonthChange(Number(value))}
        >
          <SelectTrigger className="w-32" aria-label="Mês">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={String(year)}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger className="w-24" aria-label="Ano">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export {
  DEFAULT_DASHBOARD_FINANCIAL_MONTH as DEFAULT_INDICACOES_MONTH,
  DEFAULT_DASHBOARD_FINANCIAL_YEAR as DEFAULT_INDICACOES_YEAR,
  DASHBOARD_MONTH_OPTIONS as INDICACOES_MONTH_OPTIONS,
};
