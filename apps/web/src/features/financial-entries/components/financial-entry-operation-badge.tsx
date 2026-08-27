"use client";

import { Badge } from "@/ui";
import { FINANCIAL_ENTRY_OPERATION_LABELS } from "@/features/financial-entries/types/financial-entry";
import type { FinancialEntryOperation } from "@/features/financial-entries/types/financial-entry";

type FinancialEntryOperationBadgeProps = {
  operation: FinancialEntryOperation;
};

export function FinancialEntryOperationBadge({
  operation,
}: FinancialEntryOperationBadgeProps) {
  const isPayable = operation === "payable";
  return (
    <Badge
      label={FINANCIAL_ENTRY_OPERATION_LABELS[operation]}
      size="small"
      sx={{
        bgcolor: isPayable ? "rgba(211, 47, 47, 0.08)" : "rgba(46, 125, 50, 0.08)",
        color: isPayable ? "error.main" : "success.main",
        fontWeight: 600,
        border: "none",
      }}
    />
  );
}
