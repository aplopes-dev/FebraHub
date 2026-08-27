"use client";

import { Badge } from "@/ui";
import {
  PURCHASE_STATUS_LABELS,
  type PurchaseDeliveryStatus,
} from "@/features/purchases/types/purchase";

type PurchaseStatusBadgeProps = {
  status: PurchaseDeliveryStatus;
};

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  const isReceived = status === "received";

  return (
    <Badge
      label={PURCHASE_STATUS_LABELS[status]}
      variant="outlined"
      color={isReceived ? "success" : "warning"}
      sx={{ fontWeight: 500 }}
    />
  );
}
