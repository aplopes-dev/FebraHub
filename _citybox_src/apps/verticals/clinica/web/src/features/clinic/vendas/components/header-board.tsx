"use client";

import { useState, useCallback, useEffect } from "react";
import { Filter, Plus, X } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";

import type { Funnel, PeriodFilter, KanbanColumn } from "../types";
import { PERIOD_OPTIONS } from "../types";
import { FunnelSelect } from "./funnel-select";
import { SearchToggleButton } from "./search-toggle-button";
import {
  FilterPopover,
  hasActiveFilters,
  type OpportunityFilters,
} from "./filter-popover";

interface HeaderBoardProps {
  funnels: Funnel[];
  selectedFunnelId: string;
  columns: KanbanColumn[];
  filters: OpportunityFilters;
  periodFilter?: PeriodFilter;
  periodStartDate?: Date;
  periodEndDate?: Date;
  searchQuery?: string;
  onFunnelChange: (funnelId: string) => void;
  onCreateFunnel: (name: string) => void;
  onUpdateFunnel?: (id: string, name: string) => void;
  onCreateOpportunity?: () => void;
  /** Sem manage: oculta "Criar Oportunidade". */
  canCreateOpportunity?: boolean;
  onFiltersChange: (filters: OpportunityFilters) => void;
  onSearchChange?: (search: string) => void;
  onFilter?: (filters: {
    funnelId: string;
    period: PeriodFilter;
    search: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export function HeaderBoard({
  funnels,
  selectedFunnelId,
  columns,
  filters,
  periodFilter = "this_month",
  periodStartDate,
  periodEndDate,
  searchQuery: externalSearchQuery = "",
  onFunnelChange,
  onCreateFunnel,
  onUpdateFunnel,
  onCreateOpportunity,
  canCreateOpportunity = true,
  onFiltersChange,
  onSearchChange,
  onFilter,
}: HeaderBoardProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodFilter>(periodFilter);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [startDate, setStartDate] = useState<Date | undefined>(periodStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(periodEndDate);

  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  useEffect(() => {
    setSelectedPeriod(periodFilter);
  }, [periodFilter]);

  useEffect(() => {
    setStartDate(periodStartDate);
  }, [periodStartDate]);

  useEffect(() => {
    setEndDate(periodEndDate);
  }, [periodEndDate]);

  const isCustomPeriod = selectedPeriod === "custom";
  const hasFilters = hasActiveFilters(filters);

  const handleFilter = useCallback(() => {
    onFilter?.({
      funnelId: selectedFunnelId,
      period: selectedPeriod,
      search: searchQuery,
      startDate: isCustomPeriod ? startDate : undefined,
      endDate: isCustomPeriod ? endDate : undefined,
    });
  }, [
    onFilter,
    selectedFunnelId,
    selectedPeriod,
    searchQuery,
    isCustomPeriod,
    startDate,
    endDate,
  ]);

  // IMPORTANTE: o filtro é aplicado a partir de event handlers (não de effects).
  // Chamar `onFilter` dentro de um useEffect, combinado com os effects que
  // espelham as props de período no estado local, criava um loop de render
  // infinito ("Maximum update depth exceeded").

  const handlePeriodChange = useCallback(
    (value: PeriodFilter) => {
      setSelectedPeriod(value);
      if (value === "custom") {
        setStartDate(undefined);
        setEndDate(undefined);
        return;
      }
      setStartDate(undefined);
      setEndDate(undefined);
      onFilter?.({
        funnelId: selectedFunnelId,
        period: value,
        search: searchQuery,
        startDate: undefined,
        endDate: undefined,
      });
    },
    [onFilter, selectedFunnelId, searchQuery],
  );

  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      setStartDate(date);
      onFilter?.({
        funnelId: selectedFunnelId,
        period: "custom",
        search: searchQuery,
        startDate: date,
        endDate,
      });
    },
    [onFilter, selectedFunnelId, searchQuery, endDate],
  );

  const handleEndDateChange = useCallback(
    (date: Date | undefined) => {
      setEndDate(date);
      onFilter?.({
        funnelId: selectedFunnelId,
        period: "custom",
        search: searchQuery,
        startDate,
        endDate: date,
      });
    },
    [onFilter, selectedFunnelId, searchQuery, startDate],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div className="flex flex-col items-start gap-3 py-4 lg:flex-row lg:justify-between lg:gap-4">
      {/* Lado esquerdo - Filtros */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <FunnelSelect
          value={selectedFunnelId}
          onValueChange={onFunnelChange}
          funnels={funnels}
          onCreateFunnel={onCreateFunnel}
          onUpdateFunnel={onUpdateFunnel}
          canManage={canCreateOpportunity}
          className="w-60"
        />

        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <div className="w-[180px] shrink-0">
            <Select
              value={selectedPeriod}
              onValueChange={(value) =>
                handlePeriodChange(value as PeriodFilter)
              }
            >
              <SelectTrigger className="w-full border-input bg-background">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustomPeriod ? (
            <>
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                placeholder="Data inicial"
                className="w-40 shrink-0"
              />
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                placeholder="Data final"
                className="w-40 shrink-0"
              />
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <FilterPopover
            filters={filters}
            onFiltersChange={onFiltersChange}
            columns={columns}
          >
            <Button variant="outline" onClick={handleFilter} className="sm:w-auto">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtrar</span>
              {hasFilters && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </FilterPopover>

          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFilters}
              className="size-9"
              title="Limpar filtros"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Lado direito - Busca e Criar */}
      <div className="flex items-center gap-2 lg:gap-3">
        <SearchToggleButton
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            onSearchChange?.(value);
          }}
          placeholder="Buscar..."
        />

        {canCreateOpportunity ? (
          <Button onClick={onCreateOpportunity} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Criar Oportunidade</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
