"use client";

import Check from "@mui/icons-material/Check";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { Badge } from "@citybox/mui";
import type { FiscalStatus } from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalStatusBadgeProps = {
  status: FiscalStatus;
};

export function FiscalStatusBadge({ status }: FiscalStatusBadgeProps) {
  const isConfigured = status === "configured";

  return (
    <Badge
      color={isConfigured ? "success" : "warning"}
      variant="outlined"
      icon={
        isConfigured ? (
          <Check sx={{ fontSize: 14 }} />
        ) : (
          <ScheduleOutlined sx={{ fontSize: 14 }} />
        )
      }
      label={isConfigured ? "Configurado" : "Pendente"}
      sx={{ fontWeight: 500 }}
    />
  );
}
