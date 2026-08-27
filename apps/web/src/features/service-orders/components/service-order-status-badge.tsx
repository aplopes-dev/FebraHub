"use client";

import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@/ui";
import { getServiceOrderStatusById } from "@/features/service-orders/services/service-order-status.service";
import type { ServiceOrderStatus } from "@/features/service-orders/types/service-order-status";

type ServiceOrderStatusBadgeProps = {
  statusId: string;
};

const VARIANT_SX: Record<ServiceOrderStatus["variant"], SxProps<Theme>> = {
  default: {
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
    color: "primary.dark",
    fontWeight: 500,
  },
  secondary: {
    borderColor: "divider",
    bgcolor: "muted.main",
    color: "text.secondary",
    fontWeight: 500,
  },
  outline: {
    borderColor: "divider",
    bgcolor: "transparent",
    color: "text.primary",
    fontWeight: 500,
  },
  destructive: {
    borderColor: (theme) => alpha(theme.palette.error.main, 0.35),
    bgcolor: "error.light",
    color: "error.dark",
    fontWeight: 500,
  },
};

export function ServiceOrderStatusBadge({
  statusId,
}: ServiceOrderStatusBadgeProps) {
  const status = getServiceOrderStatusById(statusId);
  if (!status) {
    return (
      <Badge
        label="Sem status"
        variant="outlined"
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  }

  return (
    <Badge
      label={status.name}
      variant="outlined"
      size="small"
      sx={VARIANT_SX[status.variant]}
    />
  );
}
