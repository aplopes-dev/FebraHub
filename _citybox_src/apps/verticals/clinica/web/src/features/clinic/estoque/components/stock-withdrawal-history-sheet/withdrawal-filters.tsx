"use client";

import { Search } from "lucide-react";

import { Input, Label } from "@citybox/ui/atoms";
import { DatePicker } from "@citybox/ui/molecules";

import type { WithdrawalFilters } from "./types";

interface WithdrawalFiltersProps {
  filters: WithdrawalFilters;
  onFiltersChange: (filters: Partial<WithdrawalFilters>) => void;
}

export function WithdrawalFiltersComponent({
  filters,
  onFiltersChange,
}: WithdrawalFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex w-72 flex-col gap-1.5">
        <Label htmlFor="withdrawal-search">Buscar por produto</Label>
        <div className="relative">
          <Search className="absolute inset-y-0 start-0 my-auto ms-3 size-4 text-muted-foreground" />
          <Input
            id="withdrawal-search"
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            className="ps-9"
          />
        </div>
      </div>

      <div className="flex w-44 flex-col gap-1.5">
        <Label>Data inicial</Label>
        <DatePicker
          value={filters.startDate}
          onChange={(date) => onFiltersChange({ startDate: date })}
        />
      </div>

      <div className="flex w-44 flex-col gap-1.5">
        <Label>Data final</Label>
        <DatePicker
          value={filters.endDate}
          onChange={(date) => onFiltersChange({ endDate: date })}
        />
      </div>
    </div>
  );
}
