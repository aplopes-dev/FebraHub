"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../../atoms/button";
import { Checkbox } from "../../atoms/checkbox";
import { Label } from "../../atoms/label";
import { Separator } from "../../atoms/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../../atoms/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/select";
import { DatePicker } from "../../molecules/date-picker";
import { DateRangePickerInput } from "../../molecules/date-range-picker";
import type { DateRange } from "react-day-picker";
import type {
  FilterGroupDef,
  FilterValues,
  CheckboxFilterGroup,
  DatePresetFilterGroup,
  CheckboxFilterValue,
  DatePresetFilterValue,
} from "./types";
import { countActiveFilterValues, createEmptyValues } from "./types";

interface FilterPopoverProps {
  groups: FilterGroupDef[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
  /** Quando informado, exibe texto ao lado do ícone no botão de abertura. */
  triggerLabel?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function CheckboxGroupSection({
  group,
  values,
  onValuesChange,
}: {
  group: CheckboxFilterGroup;
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
}) {
  const selected = (values[group.key] as CheckboxFilterValue) ?? [];

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onValuesChange({ ...values, [group.key]: next });
  }

  return (
    <div className="px-4 py-3">
      <SectionTitle>{group.title}</SectionTitle>
      <div className="space-y-2">
        {group.options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <Checkbox
              id={`${group.key}-${option.value}`}
              checked={selected.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
            />
            <Label
              htmlFor={`${group.key}-${option.value}`}
              className="cursor-pointer text-sm font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatePresetGroupSection({
  group,
  values,
  onValuesChange,
}: {
  group: DatePresetFilterGroup;
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
}) {
  const val = (values[group.key] as DatePresetFilterValue) ?? {
    preset: null,
    date: null,
  };

  function handlePreset(preset: string) {
    const keepDate =
      group.datePickerTriggerValue && preset === group.datePickerTriggerValue;
    onValuesChange({
      ...values,
      [group.key]: { preset, date: keepDate ? val.date : null },
    });
  }

  function handleDate(date: Date | DateRange | undefined) {
    onValuesChange({ ...values, [group.key]: { ...val, date: date ?? null } });
  }

  function clear() {
    onValuesChange({ ...values, [group.key]: { preset: null, date: null } });
  }

  return (
    <div className="px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <SectionTitle>{group.title}</SectionTitle>
        {val.preset && (
          <button
            onClick={clear}
            className="mb-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>

      <Select value={val.preset ?? ""} onValueChange={handlePreset}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          {group.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {group.datePickerTriggerValue &&
        val.preset === group.datePickerTriggerValue && (
          <div className="mt-3">
            <DateRangePickerInput
              value={val.date as DateRange | undefined}
              onChange={handleDate}
              placeholder="Selecionar período"
              className="w-full"
            />
          </div>
        )}
    </div>
  );
}

function renderGroup(
  group: FilterGroupDef,
  values: FilterValues,
  onValuesChange: (v: FilterValues) => void,
) {
  if (group.type === "checkbox") {
    return (
      <CheckboxGroupSection
        key={group.key}
        group={group}
        values={values}
        onValuesChange={onValuesChange}
      />
    );
  }
  return (
    <DatePresetGroupSection
      key={group.key}
      group={group}
      values={values}
      onValuesChange={onValuesChange}
    />
  );
}

function splitGroups(
  groups: FilterGroupDef[],
): [FilterGroupDef[], FilterGroupDef[]] {
  const left = groups.filter((g, i) => {
    if (g.column === "left") return true;
    if (g.column === "right") return false;
    return i < Math.ceil(groups.length / 2);
  });
  const right = groups.filter((g, i) => {
    if (g.column === "right") return true;
    if (g.column === "left") return false;
    return i >= Math.ceil(groups.length / 2);
  });
  return [left, right];
}

export function FilterPopover({
  groups,
  values,
  onValuesChange,
  triggerLabel,
}: FilterPopoverProps) {
  const activeCount = countActiveFilterValues(values, groups);
  const emptyValues = React.useMemo(() => createEmptyValues(groups), [groups]);
  const [leftGroups, rightGroups] = React.useMemo(
    () => splitGroups(groups),
    [groups],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={triggerLabel ? "outline" : "secondary"}
          size={triggerLabel ? "sm" : "icon"}
          aria-label={triggerLabel ?? "Filtrar"}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {triggerLabel ? <span>{triggerLabel}</span> : null}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[560px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-sm font-semibold">Filtros</span>
          {activeCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onValuesChange(emptyValues)}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <Separator className="" />

        {/* Two columns */}
        <div className="grid grid-cols-2">
          <div className="divide-y divide-border border-r border-border">
            {leftGroups.map((g) => renderGroup(g, values, onValuesChange))}
          </div>
          <div className="divide-y divide-border">
            {rightGroups.map((g) => renderGroup(g, values, onValuesChange))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
