'use client';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { parseIsoDateString, toIsoDateOnly } from '../../../lib/patient-document-date';
import {
  PATIENT_FINANCIAL_PERIOD_OPTIONS,
  type PatientFinancialPeriod,
} from '../../../lib/patient-financial-period';

type PatientFinancialPeriodFilterProps = {
  period: PatientFinancialPeriod;
  customStartDate: string | null;
  customEndDate: string | null;
  onPeriodChange: (period: PatientFinancialPeriod) => void;
  onCustomStartDateChange: (date: string | null) => void;
  onCustomEndDateChange: (date: string | null) => void;
};

export function PatientFinancialPeriodFilter({
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: PatientFinancialPeriodFilterProps) {
  const showCustomDates = period === 'custom';

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto sm:gap-3">
      <Label htmlFor="patient-financial-period" className="shrink-0 text-sm font-medium">
        Exibindo
      </Label>
      <Select
        value={period}
        onValueChange={(value) => onPeriodChange(value as PatientFinancialPeriod)}
      >
        <SelectTrigger
          id="patient-financial-period"
          className="h-9 w-[12.5rem] shrink-0 border-border bg-input/50 sm:w-[14rem]"
          aria-label="Período de exibição"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PATIENT_FINANCIAL_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustomDates ? (
        <>
          <Label className="shrink-0 text-sm">Data inicial</Label>
          <DatePicker
            value={customStartDate ? parseIsoDateString(customStartDate) : undefined}
            className="h-9 min-h-9 w-[9.5rem] shrink-0 rounded-3xl border-border bg-input/50 px-3 text-sm hover:bg-input/50"
            onChange={(date) => onCustomStartDateChange(date ? toIsoDateOnly(date) : null)}
          />

          <Label className="shrink-0 text-sm">Data final</Label>
          <DatePicker
            value={customEndDate ? parseIsoDateString(customEndDate) : undefined}
            className="h-9 min-h-9 w-[9.5rem] shrink-0 rounded-3xl border-border bg-input/50 px-3 text-sm hover:bg-input/50"
            onChange={(date) => onCustomEndDateChange(date ? toIsoDateOnly(date) : null)}
          />
        </>
      ) : null}
    </div>
  );
}
