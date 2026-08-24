"use client";

import FilterList from "@mui/icons-material/FilterList";
import Sort from "@mui/icons-material/Sort";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import { Badge, Button, Menu, MenuItem, SearchInput } from "@citybox/mui";
import { countActiveFinancialEntryFilters } from "@/features/financial-entries/lib/financial-entry-filters";
import { FINANCIAL_ENTRY_SORT_OPTIONS } from "@/features/financial-entries/types/financial-entry";
import type {
  FinancialEntryListFilters,
  FinancialEntrySortOption,
} from "@/features/financial-entries/types/financial-entry";

type FinancialEntryListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FinancialEntryListFilters;
  sort: FinancialEntrySortOption;
  onSortChange: (sort: FinancialEntrySortOption) => void;
  onOpenFilters: () => void;
};

export function FinancialEntryListToolbar({
  search,
  onSearchChange,
  filters,
  sort,
  onSortChange,
  onOpenFilters,
}: FinancialEntryListToolbarProps) {
  const activeFilterCount = countActiveFinancialEntryFilters(filters);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <SearchInput
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por descrição, cliente ou fornecedor…"
        aria-label="Buscar lançamentos"
        sx={{ width: "100%", maxWidth: 360 }}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        <Button
          type="button"
          variant="outlined"
          startIcon={<FilterList sx={{ fontSize: 16 }} />}
          onClick={onOpenFilters}
        >
          Filtro
          {activeFilterCount > 0 ? (
            <Badge
              label={activeFilterCount}
              sx={{
                ml: 1,
                height: 20,
                "& .MuiChip-label": { px: 0.75, fontSize: "0.75rem" },
              }}
            />
          ) : null}
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={<Sort sx={{ fontSize: 16 }} />}
          onClick={(event) => setSortAnchor(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(sortAnchor)}
        >
          Ordenação
        </Button>
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {FINANCIAL_ENTRY_SORT_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={sort === option.value}
              onClick={() => {
                onSortChange(option.value);
                setSortAnchor(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    </Stack>
  );
}
