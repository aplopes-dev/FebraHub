"use client";

import { Badge } from "@citybox/mui";
import {
  PURCHASE_LINE_STATUS_LABELS,
  type PurchaseLineStatus,
} from "@/features/purchases/types/purchase";

type PurchaseLineStatusBadgeProps = {
  status: PurchaseLineStatus;
};

const STATUS_COLOR: Record<
  PurchaseLineStatus,
  "warning" | "success" | "default"
> = {
  pending: "warning",
  received: "success",
  cancelled: "default",
};

export function PurchaseLineStatusBadge({
  status,
}: PurchaseLineStatusBadgeProps) {
  return (
    <Badge
      label={PURCHASE_LINE_STATUS_LABELS[status]}
      variant="outlined"
      color={STATUS_COLOR[status]}
      sx={{ fontWeight: 500 }}
    />
  );
}
