"use client";

import { Badge } from "@citybox/mui";

type InventoryDivergenceBadgeProps = {
  divergence: number;
};

export function InventoryDivergenceBadge({
  divergence,
}: InventoryDivergenceBadgeProps) {
  if (divergence === 0) {
    return (
      <Badge
        label="Sem divergência"
        variant="outlined"
        color="success"
        sx={{ fontWeight: 500 }}
      />
    );
  }

  const isSurplus = divergence > 0;
  return (
    <Badge
      label={isSurplus ? `Sobra +${divergence}` : `Falta ${divergence}`}
      variant="outlined"
      color={isSurplus ? "warning" : "error"}
      sx={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}
    />
  );
}
