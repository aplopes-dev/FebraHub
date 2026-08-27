"use client";

import { Badge } from "@/ui";
import { statusLabel } from "@/features/financial-entries/types/financial-entry";
import type {
  FinancialEntryOperation,
  FinancialEntryStatus,
} from "@/features/financial-entries/types/financial-entry";

type FinancialEntryStatusBadgeProps = {
  operation: FinancialEntryOperation;
  status: FinancialEntryStatus;
};

export function FinancialEntryStatusBadge({
  operation,
  status,
}: FinancialEntryStatusBadgeProps) {
  return (
    <Badge
      label={statusLabel(operation, status)}
      color={status === "paid" ? "primary" : "default"}
      variant={status === "paid" ? "filled" : "outlined"}
      size="small"
    />
  );
}
