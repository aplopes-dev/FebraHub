"use client";

import FilterList from "@mui/icons-material/FilterList";
import Sort from "@mui/icons-material/Sort";

import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { Badge, Button, Menu, SearchInput } from "@/ui";
import {
  TECHNICAL_SHEET_SORT_OPTIONS,
  countActiveTechnicalSheetFilters,
} from "@/features/technical-sheets/lib/technical-sheet-filters";
import { ALL_CATEGORIES } from "@/features/technical-sheets/hooks/use-technical-sheet-list";
import type {
  TechnicalSheetListFilters,
  TechnicalSheetSortOption,
} from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  filters: TechnicalSheetListFilters;
  sort: TechnicalSheetSortOption;
  onSortChange: (sort: TechnicalSheetSortOption) => void;
  onOpenFilters: () => void;
};

export function TechnicalSheetListToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  filters,
  sort,
  onSortChange,
  onOpenFilters,
}: TechnicalSheetListToolbarProps) {
  const activeFilterCount = countActiveTechnicalSheetFilters(filters);
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { sm: "center" },
          flex: 1,
        }}
      >
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          size="small"
          placeholder="Buscar por nome, SKU ou categoria…"
          sx={{ width: "100%", maxWidth: 360 }}
        />
        <FormControl sx={{ minWidth: 200, maxWidth: 208 }}>
          <Select
            labelId="category-filter-label"
            size="small"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as string)}
          >
            <MenuItem value={ALL_CATEGORIES}>Todas as categorias</MenuItem>
            {categories.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
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
          {TECHNICAL_SHEET_SORT_OPTIONS.map((option) => (
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
