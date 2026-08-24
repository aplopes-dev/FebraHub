'use client';

import { useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Badge, Button, Stack } from '@citybox/mui/atoms';
import {
  createEmptyValues,
  hasActiveFilterValues,
  type CheckboxFilterValue,
  type DatePresetFilterValue,
  type DateRange,
  type FilterGroupDef,
  type FilterValues,
} from './filter-types';

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isDateRange(value: unknown): value is DateRange {
  return (
    value !== null &&
    typeof value === 'object' &&
    ('from' in (value as Record<string, unknown>) ||
      'to' in (value as Record<string, unknown>))
  );
}

function formatValue(dateOrRange: Date | DateRange): string {
  if (isDateRange(dateOrRange)) {
    if (dateOrRange.from && dateOrRange.to) {
      return `${formatDate(dateOrRange.from)} – ${formatDate(dateOrRange.to)}`;
    }
    if (dateOrRange.from) {
      return `${formatDate(dateOrRange.from)} – ...`;
    }
    return '';
  }
  return formatDate(dateOrRange);
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge
      label={label}
      size="small"
      onDelete={onRemove}
      deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
      sx={{ height: 24, fontSize: 12, fontWeight: 500 }}
    />
  );
}

type FilterPillsProps = {
  groups: FilterGroupDef[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
};

export function FilterPills({ groups, values, onValuesChange }: FilterPillsProps) {
  const emptyValues = useMemo(() => createEmptyValues(groups), [groups]);

  if (!hasActiveFilterValues(values, groups)) return null;

  const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];

  for (const group of groups) {
    if (group.type === 'checkbox') {
      const selected = (values[group.key] as CheckboxFilterValue) ?? [];
      const prefix = group.pillPrefix ?? group.title;

      for (const value of selected) {
        const option = group.options.find((o) => o.value === value);
        if (!option) continue;

        pills.push({
          key: `${group.key}-${value}`,
          label: `${prefix}: ${option.label}`,
          onRemove: () =>
            onValuesChange({
              ...values,
              [group.key]: selected.filter((v) => v !== value),
            }),
        });
      }
    }

    if (group.type === 'date-preset') {
      const val = (values[group.key] as DatePresetFilterValue) ?? {
        preset: null,
        date: null,
      };

      if (!val.preset) continue;

      const isDatePicker =
        group.datePickerTriggerValue &&
        val.preset === group.datePickerTriggerValue;

      if (isDatePicker && !val.date) continue;

      let label: string;
      if (isDatePicker && val.date) {
        const prefix = group.datePickerPillPrefix ?? 'Data';
        label = `${prefix}: ${formatValue(val.date)}`;
      } else {
        const option = group.options.find((o) => o.value === val.preset);
        const prefix = group.pillPrefix ?? group.title;
        label = `${prefix}: ${option?.label ?? val.preset}`;
      }

      pills.push({
        key: group.key,
        label,
        onRemove: () =>
          onValuesChange({
            ...values,
            [group.key]: { preset: null, date: null },
          }),
      });
    }
  }

  if (pills.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {pills.map((pill) => (
        <Pill key={pill.key} label={pill.label} onRemove={pill.onRemove} />
      ))}
      <Button
        variant="text"
        size="small"
        onClick={() => onValuesChange(emptyValues)}
        sx={{ fontSize: 12, color: 'text.secondary', minWidth: 0, px: 1 }}
      >
        Limpar filtros
      </Button>
    </Stack>
  );
}
