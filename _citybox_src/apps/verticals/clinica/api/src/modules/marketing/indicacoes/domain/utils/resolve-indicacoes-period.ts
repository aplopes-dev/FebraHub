import type { IndicacoesPeriodMode } from '../indicacoes.types';
import { resolvePatientAcquisitionPeriodRange } from '../../../../dashboard/application/utils/dashboard-patient-acquisition.math';

export function resolveIndicacoesPeriodRange(input: {
  periodMode: IndicacoesPeriodMode;
  year: number;
  month?: number;
}): { startDate: string; endDate: string; startAt: Date; endAt: Date } {
  const range = resolvePatientAcquisitionPeriodRange({
    periodMode: input.periodMode,
    year: input.year,
    month: input.month,
  });

  return {
    startDate: range.startIsoDate,
    endDate: range.endIsoDate,
    startAt: range.startAt,
    endAt: range.endAt,
  };
}
