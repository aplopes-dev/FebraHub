"use client";

import { useState } from "react";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import Stack from "@mui/material/Stack";
import { Badge, Button, Menu, MenuItem, SearchInput } from "@citybox/mui";
import {
  countActiveSalesContractFilters,
  SALES_CONTRACT_SORT_OPTIONS,
} from "@/features/sales-contracts/lib/sales-contract-filters";
import type {
  SalesContractListFilters,
  SalesContractSortOption,
} from "@/features/sales-contracts/types/sales-contract";

type SalesContractListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: SalesContractListFilters;
  sort: SalesContractSortOption;
  onSortChange: (sort: SalesContractSortOption) => void;
  onOpenFilters: () => void;
};

export function SalesContractListToolbar({
  search,
  onSearchChange,
  filters,
  sort,
  onSortChange,
  onOpenFilters,
}: SalesContractListToolbarProps) {
  const activeFilterCount = countActiveSalesContractFilters(filters);
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
        placeholder="Buscar por contrato, cliente ou item…"
        sx={{ width: "100%", maxWidth: 360 }}
        slotProps={{
          htmlInput: { "aria-label": "Buscar contratos de venda" },
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
          {SALES_CONTRACT_SORT_OPTIONS.map((option) => (
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
