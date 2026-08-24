"use client";

import { useState } from "react";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import Stack from "@mui/material/Stack";
import { Badge, Button, Menu, MenuItem, SearchInput } from "@citybox/mui";
import {
  countActiveSaleOrderFilters,
  SALE_ORDER_SORT_OPTIONS,
} from "@/features/sales-orders/lib/sale-order-filters";
import type {
  SaleOrderListFilters,
  SaleOrderSortOption,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: SaleOrderListFilters;
  sort: SaleOrderSortOption;
  onSortChange: (sort: SaleOrderSortOption) => void;
  onOpenFilters: () => void;
};

export function SaleOrderListToolbar({
  search,
  onSearchChange,
  filters,
  sort,
  onSortChange,
  onOpenFilters,
}: SaleOrderListToolbarProps) {
  const activeFilterCount = countActiveSaleOrderFilters(filters);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

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
        placeholder="Buscar por pedido, cliente ou criador…"
        sx={{ width: "100%", maxWidth: 360 }}
        slotProps={{
          htmlInput: { "aria-label": "Buscar pedidos de venda" },
        }}
      />
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Button
          type="button"
          variant="outlined"
          startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
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
          startIcon={<SortIcon sx={{ fontSize: 16 }} />}
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
          {SALE_ORDER_SORT_OPTIONS.map((option) => (
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
