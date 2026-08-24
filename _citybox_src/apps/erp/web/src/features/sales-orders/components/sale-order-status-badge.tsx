"use client";

import { Badge } from "@citybox/mui";
import {
  SALE_ORDER_STATUS_BADGE_SX,
  SALE_ORDER_STATUS_LABELS,
} from "@/features/sales-orders/lib/sale-order-status";
import type { SaleOrderStatus } from "@/features/sales-orders/types/sale-order";

type SaleOrderStatusBadgeProps = {
  status: SaleOrderStatus;
};

export function SaleOrderStatusBadge({ status }: SaleOrderStatusBadgeProps) {
  return (
    <Badge
      label={SALE_ORDER_STATUS_LABELS[status]}
      variant="outlined"
      size="small"
      sx={SALE_ORDER_STATUS_BADGE_SX[status]}
    />
  );
}
