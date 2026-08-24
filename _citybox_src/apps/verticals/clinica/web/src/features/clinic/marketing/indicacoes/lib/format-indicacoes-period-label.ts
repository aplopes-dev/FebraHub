import { DASHBOARD_MONTH_OPTIONS } from '@/features/clinic/modules/dashboard/lib/dashboard-financial';
import type { IndicacoesPeriodMode } from '../types/indicacoes';

export function formatIndicacoesPeriodLabel(input: {
  mode: IndicacoesPeriodMode;
  year: number;
  month: number;
}): string {
  if (input.mode === 'annual') {
    return `Anual ${input.year}`;
  }

  const monthLabel =
    DASHBOARD_MONTH_OPTIONS.find((option) => option.value === input.month)
      ?.label ?? String(input.month);
  return `Mensal ${monthLabel}/${input.year}`;
}
