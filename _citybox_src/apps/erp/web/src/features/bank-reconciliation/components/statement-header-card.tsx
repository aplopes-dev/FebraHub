"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Typography } from "@citybox/mui";
import { StatementStatusBadge } from "@/features/bank-reconciliation/components/statement-status-badge";
import { formatIsoDateBR } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { BankStatement } from "@/features/bank-reconciliation/types/bank-statement";

type StatementHeaderCardProps = {
  bankStatement: BankStatement;
};

/** Sem logo de banco (nenhum ativo disponível no projeto, ver Assumptions do
 *  spec) — avatar com as iniciais do nome do banco. */
function bankInitials(bankName: string): string {
  const trimmed = bankName.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function StatementHeaderCard({ bankStatement }: StatementHeaderCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontWeight: 700,
          }}
        >
          {bankInitials(bankStatement.bankName || bankStatement.bankCode)}
        </Box>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {bankStatement.bankName || `Banco ${bankStatement.bankCode}`}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Agência {bankStatement.branchNumber || "—"} · Conta{" "}
            {bankStatement.accountNumber || "—"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Período: {formatIsoDateBR(bankStatement.periodStart)} a{" "}
            {formatIsoDateBR(bankStatement.periodEnd)}
          </Typography>
        </Stack>
        <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
          <StatementStatusBadge status={bankStatement.status} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {bankStatement.counts.pending} pendente(s) · {bankStatement.counts.reconciled}{" "}
            conciliada(s) · {bankStatement.counts.discarded} excluída(s)
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
