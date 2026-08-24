"use client";

import Stack from "@mui/material/Stack";
import { SearchInput } from "@citybox/mui";
import { StockMovementReasonFilter } from "@/features/stock-movements/components/stock-movement-reason-filter";
import type { StockMovementReason } from "@/features/stock-movements/types/stock-movement-reason";

type StockMovementListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  reason: StockMovementReason | null;
  onReasonChange: (value: StockMovementReason | null) => void;
};

export function StockMovementListToolbar({
  search,
  onSearchChange,
  reason,
  onReasonChange,
}: StockMovementListToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" } }}
    >
      <SearchInput
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por categoria, estoque ou produto…"
        aria-label="Buscar movimentações"
        sx={{ width: { xs: "100%", sm: 320 } }}
      />

      <StockMovementReasonFilter value={reason} onChange={onReasonChange} />
    </Stack>
  );
}
