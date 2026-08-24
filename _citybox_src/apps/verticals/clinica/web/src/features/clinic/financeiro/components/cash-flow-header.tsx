"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Filter,
  TrendingDown,
  TrendingUp,
  Plus,
  ChevronDown,
  X,
  Download,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Checkbox,
  Label,
  Badge,
  Separator,
} from "@citybox/ui/atoms";
import { SelectField, DatePickerField, MultipleSelectorField } from "../_ui/fields";
import type { CashFlowPeriodFilter, CashFlowFilters } from "../types";
import { useFinancialAccounts } from "../hooks/use-financial-accounts";
import { useExpenseCategories } from "../hooks/use-expense-categories";
import { useFinancialPermissions } from "../hooks/use-financial-permissions";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Dinheiro" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "pix", label: "PIX" },
  { value: "transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "check", label: "Cheque" },
];

const TYPE_LABELS: Record<string, string> = {
  income: "Receitas",
  expense: "Despesas",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Pagas",
  unpaid: "Não pagas",
  scheduled: "Agendadas",
};

const RECEIPT_LABELS: Record<string, string> = {
  with: "Com nota fiscal",
  without: "Sem nota fiscal",
};

interface FilterPill {
  key: string;
  label: string;
  onRemove: () => void;
}

function countActiveFilters(filters: CashFlowFilters): number {
  return [
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.hasReceipt !== "all",
    filters.cashRegisters.length > 0,
    filters.paymentMethods.length > 0,
    filters.categories.length > 0,
  ].filter(Boolean).length;
}

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

interface CashFlowHeaderProps {
  period?: CashFlowPeriodFilter;
  startDate?: Date;
  endDate?: Date;
  onPeriodChange?: (period: CashFlowPeriodFilter) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  filters?: CashFlowFilters;
  onFiltersChange?: (filters: CashFlowFilters) => void;
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function CashFlowHeader({
  period = "today",
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  filters = {
    types: [],
    statuses: [],
    hasReceipt: "all",
    cashRegisters: [],
    paymentMethods: [],
    categories: [],
  },
  onFiltersChange,
  onAddExpense,
  onAddIncome,
  onExport,
  isExporting = false,
}: CashFlowHeaderProps) {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const { data: accounts } = useFinancialAccounts();
  const { data: expenseCategories } = useExpenseCategories();
  const { canCreateIncome, canCreateExpense, canViewIncome, canViewExpense } =
    useFinancialPermissions();
  const canAdd = canCreateIncome || canCreateExpense;
  const showIncomeTypeFilter = canViewIncome;
  const showExpenseTypeFilter = canViewExpense;
  /** Só mostra o bloco Tipo quando há mais de um tipo possível. */
  const showTypeFilters = showIncomeTypeFilter && showExpenseTypeFilter;

  const accountOptions = (accounts ?? []).map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = (expenseCategories ?? []).map((c) => ({ value: c.id, label: c.name }));
  const isCustomPeriod = period === "custom";
  const activeFiltersCount = useMemo(() => countActiveFilters(filters), [filters]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange?.({
      types: [],
      statuses: [],
      hasReceipt: "all",
      cashRegisters: [],
      paymentMethods: [],
      categories: [],
    });
  }, [onFiltersChange]);

  const handleTypeToggle = (type: "income" | "expense", checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter((t) => t !== type);
    onFiltersChange?.({
      ...filters,
      types: newTypes,
    });
  };

  const handleStatusToggle = (
    status: "paid" | "unpaid" | "scheduled",
    checked: boolean
  ) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter((s) => s !== status);
    onFiltersChange?.({
      ...filters,
      statuses: newStatuses,
    });
  };

  const handleReceiptChange = (value: "with" | "without" | "all") => {
    onFiltersChange?.({
      ...filters,
      hasReceipt: value,
    });
  };

  const handlePeriodChange = useCallback(
    (newPeriod: CashFlowPeriodFilter) => {
      onPeriodChange?.(newPeriod);
    },
    [onPeriodChange]
  );

  const periodOptions = PERIOD_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Build active filter pills for display
  const filterPills: FilterPill[] = useMemo(() => {
    const pills: FilterPill[] = [];

    // Type filters
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

    // Status filters
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

    // Receipt filter
    if (filters.hasReceipt !== "all") {
      pills.push({
        key: "receipt",
        label: RECEIPT_LABELS[filters.hasReceipt] ?? filters.hasReceipt,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            hasReceipt: "all",
          }),
      });
    }

    // Cash register filters
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

    // Payment method filters
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

    // Category filters
    for (const categoryId of filters.categories) {
      const category = categoryOptions.find((c) => c.value === categoryId);
      pills.push({
        key: `category-${categoryId}`,
        label: category?.label ?? categoryId,
        onRemove: () =>
          onFiltersChange?.({
            ...filters,
            categories: filters.categories.filter((c) => c !== categoryId),
          }),
      });
    }

    return pills;
  }, [filters, onFiltersChange, accountOptions, categoryOptions]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 sm:gap-3 sm:py-4">
      {/* Lado esquerdo - Filtros */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
        <Label className="shrink-0 text-sm font-normal text-foreground">
          Exibindo financeiro
        </Label>
        <SelectField
          value={period}
          onValueChange={(value: string) =>
            handlePeriodChange(value as CashFlowPeriodFilter)
          }
          options={periodOptions}
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
            className="w-[min(600px,calc(100vw-2rem))] max-h-[min(80dvh,calc(100dvh-2rem))] overflow-y-auto p-4"
            align="center"
            collisionPadding={16}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                {showTypeFilters ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tipo</Label>
                    <div className="space-y-2">
                      {showIncomeTypeFilter ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-income"
                            checked={filters.types.includes("income")}
                            onCheckedChange={(checked) =>
                              handleTypeToggle("income", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="filter-income"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Receitas
                          </Label>
                        </div>
                      ) : null}
                      {showExpenseTypeFilter ? (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-expense"
                            checked={filters.types.includes("expense")}
                            onCheckedChange={(checked) =>
                              handleTypeToggle("expense", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor="filter-expense"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Despesas
                          </Label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {showTypeFilters ? <Separator /> : null}

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-paid"
                        checked={filters.statuses.includes("paid")}
                        onCheckedChange={(checked) =>
                          handleStatusToggle("paid", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="filter-paid"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Pagas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-unpaid"
                        checked={filters.statuses.includes("unpaid")}
                        onCheckedChange={(checked) =>
                          handleStatusToggle("unpaid", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="filter-unpaid"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Não pagas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-scheduled"
                        checked={filters.statuses.includes("scheduled")}
                        onCheckedChange={(checked) =>
                          handleStatusToggle("scheduled", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="filter-scheduled"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Agendadas
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nota Fiscal</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="receipt-all"
                        name="receipt"
                        checked={filters.hasReceipt === "all"}
                        onChange={() => handleReceiptChange("all")}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="receipt-all"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Todos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="receipt-with"
                        name="receipt"
                        checked={filters.hasReceipt === "with"}
                        onChange={() => handleReceiptChange("with")}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="receipt-with"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Com nota fiscal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="receipt-without"
                        name="receipt"
                        checked={filters.hasReceipt === "without"}
                        onChange={() => handleReceiptChange("without")}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="receipt-without"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Sem nota fiscal
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-4 border-t pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                <div className="space-y-3">
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
                    options={PAYMENT_METHOD_OPTIONS}
                    value={filters.paymentMethods[0] || ""}
                    onValueChange={(value) =>
                      onFiltersChange?.({
                        ...filters,
                        paymentMethods: value ? [value] : [],
                      })
                    }
                  />

                  <MultipleSelectorField
                    label="Categoria da despesa"
                    options={categoryOptions}
                    value={filters.categories}
                    onValueChange={(value) =>
                      onFiltersChange?.({
                        ...filters,
                        categories: value,
                      })
                    }
                  />
                </div>
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

        {/* Filter pills - mostram os filtros ativos ao lado do botão Filtrar */}
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

      {/* Lado direito - Adicionar */}
      {canAdd ? (
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
                <ChevronDown className="ml-2 h-4 w-4 sm:ml-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {canCreateIncome ? (
                <DropdownMenuItem
                  onClick={onAddIncome}
                  className="text-base cursor-pointer"
                >
                  <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                  Receita
                </DropdownMenuItem>
              ) : null}
              {canCreateExpense ? (
                <DropdownMenuItem
                  onClick={onAddExpense}
                  className="text-base cursor-pointer"
                >
                  <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                  Despesa
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
