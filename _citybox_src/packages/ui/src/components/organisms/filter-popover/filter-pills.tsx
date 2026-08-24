"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "../../atoms/button";
import { Badge } from "../../atoms/badge";
import type {
  FilterGroupDef,
  FilterValues,
  CheckboxFilterValue,
  DatePresetFilterValue,
} from "./types";
import { hasActiveFilterValues, createEmptyValues } from "./types";
import type { DateRange } from "react-day-picker";

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isDateRange(value: unknown): value is DateRange {
  return (
    value !== null &&
    typeof value === "object" &&
    ("from" in (value as Record<string, unknown>) || "to" in (value as Record<string, unknown>))
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
    return "";
  }
  return formatDate(dateOrRange);
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="flex h-6 items-center gap-1 rounded-full pl-2.5 pr-1 text-xs font-medium"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remover filtro ${label}`}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10 focus:outline-none"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}

interface FilterPillsProps {
  groups: FilterGroupDef[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
}

export function FilterPills({ groups, values, onValuesChange }: FilterPillsProps) {
  if (!hasActiveFilterValues(values, groups)) return null;

  const emptyValues = React.useMemo(() => createEmptyValues(groups), [groups]);

  const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];

  for (const group of groups) {
    if (group.type === "checkbox") {
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

    if (group.type === "date-preset") {
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
        const prefix = group.datePickerPillPrefix ?? "Data";
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
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <Pill key={pill.key} label={pill.label} onRemove={pill.onRemove} />
      ))}
      <Button
        variant="link"
        size="xs"
        className="h-6 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
        onClick={() => onValuesChange(emptyValues)}
      >
        Limpar filtros
      </Button>
    </div>
  );
}
