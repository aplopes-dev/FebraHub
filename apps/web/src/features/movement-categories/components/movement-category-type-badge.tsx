"use client";

import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";
import { Badge } from "@/ui";
import {
  MOVEMENT_CATEGORY_TYPE_LABELS,
  type MovementCategoryType,
} from "@/features/movement-categories/types/movement-category";

type MovementCategoryTypeBadgeProps = {
  type: MovementCategoryType;
};

export function MovementCategoryTypeBadge({
  type,
}: MovementCategoryTypeBadgeProps) {
  const isEntrada = type === "entrada";

  return (
    <Badge
      label={MOVEMENT_CATEGORY_TYPE_LABELS[type]}
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
