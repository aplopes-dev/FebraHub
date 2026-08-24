"use client";

import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@citybox/mui";
import { PAYMENT_STATUS_LABELS } from "@/features/sales-contracts/lib/sales-contract-labels";
import type { PaymentStatus } from "@/features/sales-contracts/types/sales-contract";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

const STATUS_SX: Record<PaymentStatus, SxProps<Theme>> = {
  paid: {
    borderColor: (theme) => alpha(theme.palette.success.main, 0.35),
    bgcolor: "success.light",
    color: "success.dark",
    fontWeight: 500,
  },
  open: {
    borderColor: "divider",
    bgcolor: "muted.main",
    color: "text.secondary",
    fontWeight: 500,
  },
  overdue: {
    borderColor: (theme) => alpha(theme.palette.error.main, 0.35),
    bgcolor: "error.light",
    color: "error.dark",
    fontWeight: 500,
  },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge
      label={PAYMENT_STATUS_LABELS[status]}
      variant="outlined"
      size="small"
      sx={STATUS_SX[status]}
    />
  );
}
