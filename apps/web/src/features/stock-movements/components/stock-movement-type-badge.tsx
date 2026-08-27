"use client";

import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";
import { Badge } from "@/ui";
import {
  STOCK_MOVEMENT_TYPE_LABELS,
  type StockMovementType,
} from "@/features/stock-movements/types/stock-movement";

type StockMovementTypeBadgeProps = {
  type: StockMovementType;
};

export function StockMovementTypeBadge({ type }: StockMovementTypeBadgeProps) {
  const isEntrada = type === "entrada";

  return (
    <Badge
      label={STOCK_MOVEMENT_TYPE_LABELS[type]}
      variant="outlined"
      color={isEntrada ? "success" : "error"}
      icon={
        isEntrada ? (
          <SouthWestOutlined sx={{ fontSize: 14 }} />
        ) : (
          <ArrowForwardOutlined sx={{ fontSize: 14 }} />
        )
      }
      sx={{ fontWeight: 500 }}
    />
  );
}
