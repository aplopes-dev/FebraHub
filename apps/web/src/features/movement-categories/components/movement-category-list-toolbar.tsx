"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import { MenuItem, SearchInput, Select } from "@/ui";
import {
  MOVEMENT_CATEGORY_TYPE_FILTER_LABELS,
  type MovementCategoryTypeFilter,
} from "@/features/movement-categories/types/movement-category";

type MovementCategoryListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: MovementCategoryTypeFilter;
  onTypeChange: (value: MovementCategoryTypeFilter) => void;
};

export function MovementCategoryListToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
}: MovementCategoryListToolbarProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <SearchInput
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por código ou nome…"
        aria-label="Buscar categorias de movimentação"
        sx={{ width: { xs: "100%", sm: 320 } }}
      />

      <FormControl sx={{ width: { xs: "100%", sm: 192 } }}>
        <InputLabel id="movement-category-type-filter-label">Tipo</InputLabel>
        <Select
          labelId="movement-category-type-filter-label"
          label="Tipo"
          value={type}
          onChange={(event) =>
            onTypeChange(event.target.value as MovementCategoryTypeFilter)
          }
        >
          {(
            Object.keys(
              MOVEMENT_CATEGORY_TYPE_FILTER_LABELS,
            ) as MovementCategoryTypeFilter[]
          ).map((key) => (
            <MenuItem key={key} value={key}>
              {MOVEMENT_CATEGORY_TYPE_FILTER_LABELS[key]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
