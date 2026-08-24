"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { SearchInput, Select } from "@citybox/mui";
import {
  FINANCIAL_GROUP_TYPE_FILTER_LABELS,
  type FinancialGroupTypeFilter,
} from "@/features/financial-groups/types/financial-group";

type FinancialGroupListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: FinancialGroupTypeFilter;
  onTypeChange: (value: FinancialGroupTypeFilter) => void;
};

export function FinancialGroupListToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
}: FinancialGroupListToolbarProps) {
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
        placeholder="Buscar grupos financeiros…"
        sx={{ width: "100%", maxWidth: 360 }}
      />
      <FormControl size="small" sx={{ width: { xs: "100%", sm: 192 } }}>
        <InputLabel id="fin-group-type-filter-label">Tipo</InputLabel>
        <Select
          labelId="fin-group-type-filter-label"
          id="fin-group-type-filter"
          label="Tipo"
          value={type}
          onChange={(event) =>
            onTypeChange(event.target.value as FinancialGroupTypeFilter)
          }
        >
          {(
            Object.keys(
              FINANCIAL_GROUP_TYPE_FILTER_LABELS,
            ) as FinancialGroupTypeFilter[]
          ).map((key) => (
            <MenuItem key={key} value={key}>
              {FINANCIAL_GROUP_TYPE_FILTER_LABELS[key]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
