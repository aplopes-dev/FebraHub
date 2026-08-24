"use client";

import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@citybox/mui";
import { semanticBadgeSx } from "@/components/ui/status";
import {
  PRODUCTION_STATUS_LABELS,
  type ProductionStatus,
} from "@/features/production/types/production";

const STATUS_SX: Record<ProductionStatus, SxProps<Theme>> = {
  pending: semanticBadgeSx("warning"),
  in_progress: semanticBadgeSx("info"),
  completed: semanticBadgeSx("success"),
  cancelled: semanticBadgeSx("neutral"),
};

/** Cor sólida para a bolinha de identificação da coluna no Kanban. */
export const PRODUCTION_STATUS_DOT_COLOR: Record<ProductionStatus, string> = {
  pending: "warning.main",
  in_progress: "info.main",
  completed: "success.main",
  cancelled: "text.disabled",
};

type ProductionStatusBadgeProps = {
  status: ProductionStatus;
};

export function ProductionStatusBadge({ status }: ProductionStatusBadgeProps) {
  return (
    <Badge
      label={PRODUCTION_STATUS_LABELS[status]}
      variant="outlined"
      sx={STATUS_SX[status]}
    />
  );
}
