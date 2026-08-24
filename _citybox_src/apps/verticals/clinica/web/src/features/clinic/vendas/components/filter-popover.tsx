"use client";

import { X } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@citybox/ui/atoms";
import { Separator } from "@citybox/ui/atoms";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";

import type { KanbanColumn } from "../types";
import { ORIGIN_OPTIONS } from "./opportunity-sheet/opportunity-form-schema";
import { useLabels } from "../hooks/use-labels";

export interface OpportunityFilters {
  labelId?: string;
  origin?: string;
  columnId?: string;
  nextContactDate?: Date;
}

interface FilterPopoverProps {
  filters: OpportunityFilters;
  onFiltersChange: (filters: OpportunityFilters) => void;
  columns: KanbanColumn[];
  children: React.ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

export function FilterPopover({
  filters,
  onFiltersChange,
  columns,
  children,
}: FilterPopoverProps) {
  const { data: labels = [] } = useLabels();

  const labelOptions: FilterOption[] = [
    { value: "all", label: "Todos os rótulos" },
    ...labels.map((label) => ({
      value: label.id,
      label: label.name,
      color: label.color,
    })),
  ];

  const originOptions: FilterOption[] = [
    { value: "all", label: "Todas as origens" },
    ...ORIGIN_OPTIONS,
  ];

  const columnOptions: FilterOption[] = [
    { value: "all", label: "Todas as colunas" },
    ...columns.map((col) => ({ value: col.id, label: col.name })),
  ];

  const handleClear = () => onFiltersChange({});

  const hasActiveFiltersLocal =
    (filters.labelId && filters.labelId !== "all") ||
    (filters.origin && filters.origin !== "all") ||
    (filters.columnId && filters.columnId !== "all") ||
    !!filters.nextContactDate;

  const renderSelect = (
    label: string,
    value: string,
    options: FilterOption[],
    onValueChange: (value: string) => void,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.color ? (
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: o.color }}
                  />
                  <span>{o.label}</span>
                </div>
              ) : (
                o.label
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros</h4>
            {hasActiveFiltersLocal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto px-2 py-1 text-xs"
              >
                <X className="mr-1 size-3" />
                Limpar
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-6">
            {renderSelect("Rótulo", filters.labelId ?? "all", labelOptions, (value) =>
              onFiltersChange({ ...filters, labelId: value }),
            )}
            {renderSelect("Origem", filters.origin ?? "all", originOptions, (value) =>
              onFiltersChange({ ...filters, origin: value }),
            )}
            {renderSelect("Coluna", filters.columnId ?? "all", columnOptions, (value) =>
              onFiltersChange({ ...filters, columnId: value }),
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Próximo contato</Label>
              <DatePicker
                value={filters.nextContactDate}
                onChange={(date) =>
                  onFiltersChange({ ...filters, nextContactDate: date })
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function hasActiveFilters(filters: OpportunityFilters): boolean {
  return (
    (!!filters.labelId && filters.labelId !== "all") ||
    (!!filters.origin && filters.origin !== "all") ||
    (!!filters.columnId && filters.columnId !== "all") ||
    !!filters.nextContactDate
  );
}
