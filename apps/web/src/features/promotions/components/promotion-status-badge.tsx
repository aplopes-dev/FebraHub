"use client";

import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@/ui";
import {
  PROMOTION_STATUS_LABELS,
  type PromotionStatus,
} from "@/features/promotions/types/promotion";

type PromotionStatusBadgeProps = {
  status: PromotionStatus;
};

const STATUS_SX: Record<PromotionStatus, SxProps<Theme>> = {
  active: {
    borderColor: (theme) => alpha(theme.palette.success.main, 0.35),
    bgcolor: "success.light",
    color: "success.dark",
    fontWeight: 500,
  },
  scheduled: {
    borderColor: (theme) => alpha(theme.palette.warning.main, 0.35),
    bgcolor: "warning.light",
    color: "warning.dark",
    fontWeight: 500,
  },
  ended: {
    borderColor: "divider",
    bgcolor: "action.hover",
    color: "text.secondary",
    fontWeight: 500,
  },
};

const STATUS_ICONS = {
  active: CheckCircleOutlinedIcon,
  scheduled: TimelapseOutlinedIcon,
  ended: HighlightOffOutlinedIcon,
} as const;

export function PromotionStatusBadge({ status }: PromotionStatusBadgeProps) {
  const Icon = STATUS_ICONS[status];

  return (
    <Badge
      label={
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Icon sx={{ fontSize: 14 }} aria-hidden />
          <span>{PROMOTION_STATUS_LABELS[status]}</span>
        </Stack>
      }
      variant="outlined"
      size="small"
      sx={STATUS_SX[status]}
    />
  );
}
