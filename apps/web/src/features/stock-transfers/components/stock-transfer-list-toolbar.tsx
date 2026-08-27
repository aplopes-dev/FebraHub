"use client";

import FilterList from "@mui/icons-material/FilterList";

import Stack from "@mui/material/Stack";
import { Badge, Button, SearchInput } from "@/ui";
import { countActiveStockTransferFilters } from "@/features/stock-transfers/lib/stock-transfer-filters";
import type { StockTransferListFilters } from "@/features/stock-transfers/types/stock-transfer";

type StockTransferListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: StockTransferListFilters;
  onOpenFilters: () => void;
};

export function StockTransferListToolbar({
  search,
  onSearchChange,
  filters,
  onOpenFilters,
}: StockTransferListToolbarProps) {
  const activeFilterCount = countActiveStockTransferFilters(filters);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{
        alignItems: { sm: "center" },
        justifyContent: "space-between",
      }}
    >
      <SearchInput
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por ID, estoque ou responsável…"
        aria-label="Buscar transferências"
        sx={{ width: "100%", maxWidth: 360 }}
      />
      <Button
        type="button"
        variant="outlined"
        startIcon={<FilterList sx={{ fontSize: 16 }} />}
        onClick={onOpenFilters}
        sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } }}
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
