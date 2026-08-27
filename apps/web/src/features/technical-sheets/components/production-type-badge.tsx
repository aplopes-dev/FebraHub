"use client";

import BoltOutlined from "@mui/icons-material/BoltOutlined";
import FactoryOutlined from "@mui/icons-material/FactoryOutlined";
import Chip from "@mui/material/Chip";
import { productionTypeLabel } from "@/features/technical-sheets/lib/technical-sheet-cost";
import type { ProductionType } from "@/features/technical-sheets/types/technical-sheet";

type ProductionTypeBadgeProps = { type: ProductionType | null };

export function ProductionTypeBadge({ type }: ProductionTypeBadgeProps) {
  if (!type) {
    return (
      <Chip
        label="Não configurada"
        variant="outlined"
        sx={{
          fontWeight: 500,
          borderRadius: 1,
          px: 0.5,
          borderColor: "divider",
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      />
    );
  }

  const isProcess = type === "productive_process";
  const IconComponent = isProcess ? FactoryOutlined : BoltOutlined;

  return (
    <Chip
      icon={<IconComponent sx={{ fontSize: 14 }} />}
      label={productionTypeLabel(type)}
      variant="outlined"
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        px: 0.5,
        ...(isProcess
          ? {
              borderColor: "warning.200",
              bgcolor: "warning.50",
              color: "warning.700",
              "& .MuiChip-icon": { color: "warning.600" },
            }
          : {
              borderColor: "success.200",
              bgcolor: "success.50",
              color: "success.700",
              "& .MuiChip-icon": { color: "success.600" },
            }),
      }}
    />
  );
}
