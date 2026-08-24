"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ActiveStatusBadge } from "@/components/ui/status";
import { ChartOfAccountRowActions } from "@/features/chart-of-accounts/components/chart-of-account-row-actions";
import type { ChartOfAccount } from "@/features/chart-of-accounts/types/chart-of-account";

type ChartOfAccountListTableProps = {
  accounts: ChartOfAccount[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (account: ChartOfAccount) => void;
  onDelete: (account: ChartOfAccount) => void;
  onRestore: (account: ChartOfAccount) => void;
};

export function ChartOfAccountListTable({
  accounts,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching,
  onPageIndexChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onRestore,
}: ChartOfAccountListTableProps) {
  const columns = useMemo<DataTableColumn<ChartOfAccount>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (account) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {account.name}
          </Typography>
        ),
      },
      {
        id: "financialGroup",
        header: "Grupo financeiro",
        render: (account) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {account.financialGroupName}
          </Typography>
        ),
      },
      {
        id: "availableForPdv",
        header: "Disponível para PDV",
        render: (account) => (
          <ActiveStatusBadge
            active={account.availableForPdv}
            activeLabel="Sim"
            inactiveLabel="Não"
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (account) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ChartOfAccountRowActions
              account={account}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={accounts}
      getRowId={(account) => account.id}
      emptyMessage="Nenhum plano de contas encontrado."
      isLoading={isFetching}
      pagination={{
        page: pageIndex + 1,
        perPage: pageSize,
        total: totalRowCount,
        onPageChange: (nextPage) => onPageIndexChange(nextPage - 1),
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
