"use client";

import Stack from "@mui/material/Stack";
import { SearchInput } from "@/ui";

type CustomerListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function CustomerListToolbar({
  search,
  onSearchChange,
}: CustomerListToolbarProps) {
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
        placeholder="Buscar por nome, e-mail ou telefone…"
        sx={{ width: "100%", maxWidth: 360 }}
      />
    </Stack>
  );
}
