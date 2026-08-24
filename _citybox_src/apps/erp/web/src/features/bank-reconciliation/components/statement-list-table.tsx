"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Typography } from "@citybox/mui";
import {
  DataTable,
  stopRowNavigation,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StatementStatusBadge } from "@/features/bank-reconciliation/components/statement-status-badge";
import { StatementRowActions } from "@/features/bank-reconciliation/components/statement-row-actions";
import { useDeleteBankStatementMutation } from "@/features/bank-reconciliation/hooks/use-bank-reconciliation-mutations";
import { formatIsoDateBR } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { BankStatementListItem } from "@/features/bank-reconciliation/types/bank-statement";

type StatementListTableProps = {
  statements: BankStatementListItem[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function StatementListTable({
  statements,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: StatementListTableProps) {
  const router = useRouter();
  const deleteMutation = useDeleteBankStatementMutation();

  const columns = useMemo<DataTableColumn<BankStatementListItem>[]>(
    () => [
      {
        id: "institution",
        header: "Instituição",
        render: (statement) => (
          <Stack spacing={0}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {statement.bankName || `Banco ${statement.bankCode}` || "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Ag. {statement.branchNumber || "—"} · Conta {statement.accountNumber || "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "period",
        header: "Período",
        render: (statement) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatIsoDateBR(statement.periodStart)} a {formatIsoDateBR(statement.periodEnd)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (statement) => <StatementStatusBadge status={statement.status} />,
      },
      {
        id: "counts",
        header: "Transações",
        render: (statement) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {statement.counts.pending} pendente(s) · {statement.counts.reconciled} conciliada(s)
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        // A linha inteira navega para o detalhe (`onRowClick`); sem cancelar o
        // evento aqui, clicar no ⋯ abria o extrato em vez de abrir o menu.
        render: (statement) => (
          <Box onClick={stopRowNavigation}>
            <StatementRowActions
              statement={statement}
              onDelete={(target) => deleteMutation.mutateAsync(target.id)}
            />
          </Box>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <DataTable
      columns={columns}
      rows={statements}
      getRowId={(statement) => statement.id}
      emptyMessage="Nenhum extrato importado ainda."
      onRowClick={(statement) =>
        router.push(`/financas/conciliacao-bancaria/${statement.id}`)
      }
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
