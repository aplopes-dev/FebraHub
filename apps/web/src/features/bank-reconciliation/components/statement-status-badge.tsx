import { SemanticBadge } from "@/components/ui/status";
import { BANK_STATEMENT_STATUS_LABELS } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { BankStatementStatus } from "@/features/bank-reconciliation/types/bank-statement";

const TONE_BY_STATUS: Record<
  BankStatementStatus,
  "neutral" | "warning" | "success"
> = {
  not_reconciled: "neutral",
  partially_reconciled: "warning",
  reconciled: "success",
};

type StatementStatusBadgeProps = {
  status: BankStatementStatus;
};

export function StatementStatusBadge({ status }: StatementStatusBadgeProps) {
  return (
    <SemanticBadge label={BANK_STATEMENT_STATUS_LABELS[status]} tone={TONE_BY_STATUS[status]} />
  );
}
