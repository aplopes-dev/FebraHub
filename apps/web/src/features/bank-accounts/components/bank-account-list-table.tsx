"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { BankAccountRowActions } from "@/features/bank-accounts/components/bank-account-row-actions";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-accounts/lib/bank-account-format";
import type { BankAccountListItem } from "@/features/bank-accounts/types/bank-account";

type BankAccountListTableProps = {
  accounts: BankAccountListItem[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function BankAccountListTable({
  accounts,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: BankAccountListTableProps) {
  const router = useRouter();

  const columns = useMemo<DataTableColumn<BankAccountListItem>[]>(
    () => [
      {
        id: "account",
        header: "Conta",
        render: (account) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                opacity: 0.9,
              }}
            >
              <AccountBalanceOutlined sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {account.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                {account.bankName}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: "openedAt",
        header: "Abertura",
        render: (account) => (
          <Typography variant="body2" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
            {formatIsoDateBR(account.openedAt)}
          </Typography>
        ),
      },
      {
        id: "units",
        header: "Unidades",
        render: (account) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {account.unitIds.length} vinculada
            {account.unitIds.length === 1 ? "" : "s"}
          </Typography>
        ),
      },
      {
        id: "balance",
        header: "Saldo atual",
        render: (account) => {
          const balance = account.currentBalance;
          return (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: balance < 0 ? "error.main" : "text.primary",
              }}
            >
              {formatCurrencyBRL(balance)}
            </Typography>
          );
        },
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
            <BankAccountRowActions account={account} />
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={accounts}
      getRowId={(account) => account.id}
      emptyMessage="Nenhuma conta bancária encontrada."
      onRowClick={(account) =>
        router.push(`/financas/contas-bancarias/${account.id}`)
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
