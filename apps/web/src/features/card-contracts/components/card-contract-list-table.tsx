"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ActiveStatusBadge } from "@/components/ui/status";
import { CardContractRowActions } from "@/features/card-contracts/components/card-contract-row-actions";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { GROUPING_LABELS } from "@/features/card-contracts/types/card-contract";
import type { CardContract } from "@/features/card-contracts/types/card-contract";

const PROVIDER_COLORS: Record<string, string> = {
  Cielo: "#0099CC",
  Stone: "#FF6900",
  Rede: "#CC0000",
  Getnet: "#003366",
  PagSeguro: "#3CC14C",
  "Mercado Pago": "#00B5E2",
  SafraPay: "#003C71",
  Credz: "#6B2FA0",
};

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "#666";
}

type CardContractListTableProps = {
  contracts: CardContract[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDelete: (contract: CardContract) => void;
  onRestore: (contract: CardContract) => void;
};

export function CardContractListTable({
  contracts,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching,
  onPageIndexChange,
  onPageSizeChange,
  onDelete,
  onRestore,
}: CardContractListTableProps) {
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of bankAccountsQuery.data ?? []) {
      map.set(account.id, account.name);
    }
    return map;
  }, [bankAccountsQuery.data]);

  const columns = useMemo<DataTableColumn<CardContract>[]>(
    () => [
      {
        id: "provider",
        header: "Provedor",
        render: (contract) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.75rem",
                fontWeight: 700,
                bgcolor: getProviderColor(contract.provider),
              }}
            >
              {contract.provider.slice(0, 2).toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {contract.provider}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "bankAccount",
        header: "Conta para crédito",
        render: (contract) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {contract.bankAccountId
              ? (bankAccountNameById.get(contract.bankAccountId) ?? "—")
              : "—"}
          </Typography>
        ),
      },
      {
        id: "grouping",
        header: "Agrupamento",
        render: (contract) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {GROUPING_LABELS[contract.grouping]}
          </Typography>
        ),
      },
      {
        id: "paymentMethods",
        header: "Métodos",
        render: (contract) => (
          <Typography variant="body2">{contract.paymentMethodCount}</Typography>
        ),
      },
      {
        id: "active",
        header: "Status",
        render: (contract) => (
          <ActiveStatusBadge
            active={contract.active && contract.deletedAt == null}
            activeLabel="Ativo"
            inactiveLabel="Inativo"
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (contract) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CardContractRowActions
              contract={contract}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Box>
        ),
      },
    ],
    [bankAccountNameById, onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={contracts}
      getRowId={(contract) => contract.id}
      emptyMessage="Nenhum contrato encontrado."
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
