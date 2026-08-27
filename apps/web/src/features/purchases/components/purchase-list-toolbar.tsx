"use client";

import FilterListIcon from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import {
  Badge,
  Button,
  MenuItem,
  SearchInput,
  Select,
} from "@/ui";
import { countActivePurchaseFilters } from "@/features/purchases/lib/purchase-filters";
import {
  PURCHASE_STATUS_FILTER_LABELS,
  PURCHASE_STATUS_FILTER_ORDER,
  type PurchaseListFilters,
  type PurchaseStatusFilter,
} from "@/features/purchases/types/purchase";

type PurchaseListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: PurchaseStatusFilter;
  onStatusChange: (value: PurchaseStatusFilter) => void;
  filters: PurchaseListFilters;
  onOpenFilters: () => void;
};

export function PurchaseListToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  filters,
  onOpenFilters,
}: PurchaseListToolbarProps) {
  const activeFilterCount = countActivePurchaseFilters(filters);

  return (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      spacing={1.5}
      sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ flex: 1, alignItems: { sm: "center" } }}
      >
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por compra, fornecedor ou NF…"
          aria-label="Buscar compras"
          sx={{ width: { xs: "100%", sm: 320 } }}
        />

        <FormControl sx={{ width: { xs: "100%", sm: 192 } }}>
          <InputLabel id="purchase-status-filter-label">Status</InputLabel>
          <Select
            labelId="purchase-status-filter-label"
            id="purchase-status-filter"
            label="Status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as PurchaseStatusFilter)
            }
          >
            {PURCHASE_STATUS_FILTER_ORDER.map((option) => (
              <MenuItem key={option} value={option}>
                {PURCHASE_STATUS_FILTER_LABELS[option]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ flexShrink: 0 }}>
        <Button
          type="button"
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={onOpenFilters}
        >
          Filtro
          {activeFilterCount > 0 ? (
            <Badge
              label={activeFilterCount}
              color="muted"
              sx={{ ml: 1, height: 20, "& .MuiChip-label": { px: 0.75 } }}
            />
          ) : null}
        </Button>
      </Box>
    </Stack>
  );
}
