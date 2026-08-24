'use client';

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { DatePickerField } from '../../_ui/fields';
import {
  COMMISSION_PERIOD_OPTIONS,
  type CommissionPeriodFilter,
} from '../types/commission-financial.types';

type CommissionPeriodSelectProps = {
  value: CommissionPeriodFilter;
  onChange: (value: CommissionPeriodFilter) => void;
  customStart?: Date;
  customEnd?: Date;
  onCustomStartChange?: (date: Date | undefined) => void;
  onCustomEndChange?: (date: Date | undefined) => void;
};

export function CommissionPeriodSelect({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: CommissionPeriodSelectProps) {
  const isCustom = value === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="shrink-0 text-sm font-normal text-foreground">
        Exibindo comissões
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as CommissionPeriodFilter)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMMISSION_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom ? (
        <>
          <DatePickerField
            placeholder="Data inicial"
            value={customStart}
            onChange={onCustomStartChange}
            dateFormat="short"
            className="w-40"
          />
          <DatePickerField
            placeholder="Data final"
            value={customEnd}
            onChange={onCustomEndChange}
            dateFormat="short"
            className="w-40"
          />
        </>
      ) : null}
    </div>
  );
}
