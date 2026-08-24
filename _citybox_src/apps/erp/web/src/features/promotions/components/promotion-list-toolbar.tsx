"use client";

import Box from "@mui/material/Box";
import { SearchInput } from "@citybox/mui";

type PromotionListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function PromotionListToolbar({
  search,
  onSearchChange,
}: PromotionListToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <SearchInput
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nome…"
        sx={{ width: "100%", maxWidth: 384 }}
        slotProps={{
          htmlInput: { "aria-label": "Buscar promoção por nome" },
        }}
      />
    </Box>
  );
}
