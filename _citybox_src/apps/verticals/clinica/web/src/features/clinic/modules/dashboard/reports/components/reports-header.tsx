'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import {
  DEFAULT_REPORT_PERIOD,
  REPORT_BUDGET_MONTH_OPTIONS,
  REPORT_BUDGET_PERIOD_MODE_OPTIONS,
  REPORT_BUDGET_YEAR_OPTIONS,
  REPORT_PERIOD_OPTIONS,
} from '../lib/reports-period';
import type {
  ReportBudgetPeriodMode,
  ReportPeriodFilter,
  ReportsHeaderFilterKind,
} from '../types/clinic-reports';

type ReportsHeaderProps = {
  title: string;
  description?: string;
  filterKind?: ReportsHeaderFilterKind;
  period: ReportPeriodFilter;
  onPeriodChange: (period: ReportPeriodFilter) => void;
  budgetPeriodMode: ReportBudgetPeriodMode;
  onBudgetPeriodModeChange: (mode: ReportBudgetPeriodMode) => void;
  budgetMonth: number;
  onBudgetMonthChange: (month: number) => void;
  budgetYear: number;
  onBudgetYearChange: (year: number) => void;
  onExport?: () => void | Promise<void>;
  isExporting?: boolean;
};

export function ReportsHeader({
  title,
  description,
  filterKind = 'relative',
  period,
  onPeriodChange,
  budgetPeriodMode,
  onBudgetPeriodModeChange,
  budgetMonth,
  onBudgetMonthChange,
  budgetYear,
  onBudgetYearChange,
  onExport,
  isExporting = false,
}: ReportsHeaderProps) {
  const handleExport = () => {
    if (onExport) {
      void onExport();
      return;
    }
    toast.message('Exportar estará disponível em breve.');
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {filterKind === 'relative' ? (
            <Select
              value={period}
              onValueChange={(value) =>
                onPeriodChange(value as ReportPeriodFilter)
              }
            >
              <SelectTrigger
                className="w-[200px]"
                aria-label="Período do relatório"
              >
                <SelectValue placeholder={DEFAULT_REPORT_PERIOD} />
              </SelectTrigger>
              <SelectContent>
                {REPORT_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {filterKind === 'budget' ? (
            <>
              <Select
                value={budgetPeriodMode}
                onValueChange={(value) =>
                  onBudgetPeriodModeChange(value as ReportBudgetPeriodMode)
                }
              >
                <SelectTrigger
                  className="w-28"
                  aria-label="Modo do período do orçamento"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_BUDGET_PERIOD_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {budgetPeriodMode === 'monthly' ? (
                <Select
                  value={String(budgetMonth)}
                  onValueChange={(value) => {
                    const next = Number(value);
                    if (Number.isInteger(next)) onBudgetMonthChange(next);
                  }}
                >
                  <SelectTrigger
                    className="w-36"
                    aria-label="Mês do orçamento"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_BUDGET_MONTH_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Select
                value={String(budgetYear)}
                onValueChange={(value) => {
                  const next = Number(value);
                  if (Number.isInteger(next)) onBudgetYearChange(next);
                }}
              >
                <SelectTrigger className="w-24" aria-label="Ano do orçamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_BUDGET_YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="size-4" aria-hidden />
            {isExporting ? 'Exportando…' : 'Exportar'}
          </Button>
        </div>
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
