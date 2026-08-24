"use client";

import { useState, useCallback, useMemo } from "react";
import { Download, Filter, X } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Checkbox,
  Label,
  Badge,
  Separator,
} from "@citybox/ui/atoms";
import { SelectField, DatePickerField, MultipleSelectorField } from "../_ui/fields";
import { PAYMENT_METHOD_OPTIONS } from "../lib/payment-method-labels";
import { useTransactionsAccounts } from "../hooks/use-transactions-query";
import type {
  CashFlowPeriodFilter,
  TransactionsFilters,
  TransactionsViewMode,
} from "../types";
import { EMPTY_TRANSACTIONS_FILTERS } from "../types";

const TYPE_LABELS: Record<string, string> = {
  income: "Receitas",
  expense: "Despesas",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Pagas",
  scheduled: "Agendadas",
};

const VIEW_OPTIONS = [
  { value: "payment_method", label: "Meio de pagamento" },
  { value: "transactions", label: "Transações" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "Todos os períodos" },
  { value: "today", label: "Hoje" },
  { value: "this_week", label: "Desta semana" },
  { value: "this_month", label: "Desse mês" },
  { value: "last_month", label: "Do mês passado" },
  { value: "last_30_days", label: "Últimos 30 dias" },
  { value: "next_30_days", label: "Próximos 30 dias" },
  { value: "custom", label: "Escolher período" },
];

interface FilterPill {
  key: string;
  label: string;
  onRemove: () => void;
}

function countActiveFilters(filters: TransactionsFilters): number {
  return [
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.cashRegisters.length > 0,
    filters.paymentMethods.length > 0,
  ].filter(Boolean).length;
}

interface TransactionsHeaderProps {
  period?: CashFlowPeriodFilter;
  startDate?: Date;
  endDate?: Date;
  onPeriodChange?: (period: CashFlowPeriodFilter) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  filters?: TransactionsFilters;
  onFiltersChange?: (filters: TransactionsFilters) => void;
  viewMode: TransactionsViewMode;
  onViewModeChange: (mode: TransactionsViewMode) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function TransactionsHeader({
  period = "this_month",
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  filters = EMPTY_TRANSACTIONS_FILTERS,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  onExport,
  isExporting = false,
}: TransactionsHeaderProps) {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const { data: accounts } = useTransactionsAccounts();

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const isCustomPeriod = period === "custom";
  const activeFiltersCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange?.({ ...EMPTY_TRANSACTIONS_FILTERS });
  }, [onFiltersChange]);

  const handleTypeToggle = (type: "income" | "expense", checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter((t) => t !== type);
    onFiltersChange?.({ ...filters, types: newTypes });
  };

  const handleStatusToggle = (
    status: "paid" | "scheduled",
    checked: boolean,
  ) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter((s) => s !== status);
    onFiltersChange?.({ ...filters, statuses: newStatuses });
  };

  const filterPills: FilterPill[] = useMemo(() => {
    const pills: FilterPill[] = [];

    for (const type of filters.types) {
      pills.push({
        key: `type-${type}`,
        label: TYPE_LABELS[type] ?? type,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            types: filters.types.filter((t) => t !== type),
          }),
      });
    }

    for (const status of filters.statuses) {
      pills.push({
        key: `status-${status}`,
        label: STATUS_LABELS[status] ?? status,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            statuses: filters.statuses.filter((s) => s !== status),
          }),
      });
    }

    for (const registerId of filters.cashRegisters) {
      const account = accountOptions.find((a) => a.value === registerId);
      pills.push({
        key: `register-${registerId}`,
        label: account?.label ?? registerId,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            cashRegisters: filters.cashRegisters.filter((r) => r !== registerId),
          }),
      });
    }

    for (const method of filters.paymentMethods) {
      const option = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
      pills.push({
        key: `payment-${method}`,
        label: option?.label ?? method,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            paymentMethods: filters.paymentMethods.filter((m) => m !== method),
          }),
      });
    }

    return pills;
  }, [filters, onFiltersChange, accountOptions]);

  return (
    <div className="flex flex-col gap-3 py-4 lg:flex-row items-start lg:justify-between lg:gap-4">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <Label className="shrink-0 text-sm font-normal text-foreground">
          Exibindo transações
        </Label>
        <SelectField
          value={period}
          onValueChange={(value: string) =>
            onPeriodChange?.(value as CashFlowPeriodFilter)
          }
          options={PERIOD_OPTIONS}
          className="w-[180px]"
        />

        {isCustomPeriod && (
          <>
            <DatePickerField
              placeholder="Data inicial"
              value={startDate}
              onChange={onStartDateChange}
              dateFormat="short"
              className="w-[calc(50%-4px)] sm:w-40"
            />
            <DatePickerField
              placeholder="Data final"
              value={endDate}
              onChange={onEndDateChange}
              dateFormat="short"
              className="w-[calc(50%-4px)] sm:w-40"
            />
          </>
        )}

        <Popover
          open={isFilterPopoverOpen}
          onOpenChange={setIsFilterPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
              {activeFiltersCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(520px,calc(100vw-2rem))] max-h-[min(80dvh,calc(100dvh-2rem))] overflow-y-auto p-4"
            align="center"
            collisionPadding={16}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tx-filter-income"
                        checked={filters.types.includes("income")}
                        onCheckedChange={(checked) =>
                          handleTypeToggle("income", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="tx-filter-income"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Receitas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tx-filter-expense"
                        checked={filters.types.includes("expense")}
                        onCheckedChange={(checked) =>
                          handleTypeToggle("expense", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="tx-filter-expense"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Despesas
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="space-y-2">
                    {(
                      [
                        ["paid", "Pagas"],
                        ["scheduled", "Agendadas"],
                      ] as const
                    ).map(([value, label]) => (
                      <div
                        key={value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`tx-filter-${value}`}
                          checked={filters.statuses.includes(value)}
                          onCheckedChange={(checked) =>
                            handleStatusToggle(value, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`tx-filter-${value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                <MultipleSelectorField
                  label="Caixa"
                  options={accountOptions}
                  value={filters.cashRegisters}
                  onValueChange={(value) =>
                    onFiltersChange?.({
                      ...filters,
                      cashRegisters: value,
                    })
                  }
                />

                <SelectField
                  label="Meio de pagamento"
                  options={[...PAYMENT_METHOD_OPTIONS]}
                  value={filters.paymentMethods[0] || ""}
                  onValueChange={(value) =>
                    onFiltersChange?.({
                      ...filters,
                      paymentMethods: value ? [value] : [],
                    })
                  }
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {onExport ? (
          <Button
            type="button"
            variant="outline"
            onClick={onExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando…" : "Exportar"}
          </Button>
        ) : null}

        {filterPills.length > 0 && (
          <>
            {filterPills.map((pill) => (
              <Badge
                key={pill.key}
                variant="secondary"
                className="flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-normal cursor-default"
              >
                {pill.label}
                <button
                  type="button"
                  onClick={pill.onRemove}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remover filtro ${pill.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground text-xs"
            >
              Limpar filtros
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Label className="hidden whitespace-nowrap text-sm font-normal text-foreground sm:inline">
          Visualizar por
        </Label>
        <SelectField
          value={viewMode}
          onValueChange={(value: string) =>
            onViewModeChange(value as TransactionsViewMode)
          }
          options={VIEW_OPTIONS}
          className="w-[200px]"
        />
      </div>
    </div>
  );
}
