"use client";

import FilterList from "@mui/icons-material/FilterList";

import Stack from "@mui/material/Stack";
import { Badge, Button, SearchInput } from "@citybox/mui";
import { countActiveFacilitaNfeFilters } from "@/features/facilita-nfe/types/fiscal-document";
import type { FacilitaNfeIssuedFilters } from "@/features/facilita-nfe/types/fiscal-document";

type FacilitaNfeToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FacilitaNfeIssuedFilters;
  onOpenFilters: () => void;
  disabled?: boolean;
};

export function FacilitaNfeToolbar({
  search,
  onSearchChange,
  filters,
  onOpenFilters,
  disabled,
}: FacilitaNfeToolbarProps) {
  const activeFilterCount = countActiveFacilitaNfeFilters(filters);

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
        placeholder="Buscar por"
        aria-label="Buscar documentos fiscais emitidos"
        disabled={disabled}
        sx={{ width: "100%", maxWidth: 360 }}
      />

      <Button
        type="button"
        variant="outlined"
        startIcon={<FilterList sx={{ fontSize: 16 }} />}
        onClick={onOpenFilters}
        disabled={disabled}
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
