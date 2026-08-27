"use client";

import FilterList from "@mui/icons-material/FilterList";

import Stack from "@mui/material/Stack";
import { Badge, Button, SearchInput } from "@/ui";
import { countActiveFinancialStatementFilters } from "@/features/financial-statement/lib/financial-statement-filters";
import type { FinancialStatementFilters } from "@/features/financial-statement/types/financial-statement";

type FinancialStatementToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FinancialStatementFilters;
  onOpenFilters: () => void;
};

export function FinancialStatementToolbar({
  search,
  onSearchChange,
  filters,
  onOpenFilters,
}: FinancialStatementToolbarProps) {
  const activeFilterCount = countActiveFinancialStatementFilters(filters);

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
        aria-label="Buscar movimentações"
        sx={{ width: "100%", maxWidth: 360 }}
      />

      <Button
        type="button"
        variant="outlined"
        startIcon={<FilterList sx={{ fontSize: 16 }} />}
        onClick={onOpenFilters}
        sx={{ flexShrink: 0 }}
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
    </Stack>
  );
}
