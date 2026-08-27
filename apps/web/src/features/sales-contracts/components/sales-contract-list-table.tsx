"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Checkbox, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { PaymentStatusBadge } from "@/features/sales-contracts/components/payment-status-badge";
import { SalesContractRowActions } from "@/features/sales-contracts/components/sales-contract-row-actions";
import { SalesContractStatusBadge } from "@/features/sales-contracts/components/sales-contract-status-badge";
import {
  formatSalesContractAmount,
  formatSalesContractDate,
} from "@/features/sales-contracts/services/sales-contract.service";
import type { SalesContract } from "@/features/sales-contracts/types/sales-contract";

type SalesContractListTableProps = {
  contracts: SalesContract[];
  /** Página 1-based. */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectOne: (id: string) => void;
  onDelete: (id: string) => boolean;
  onRestore: (id: string) => boolean;
};

export function SalesContractListTable({
  contracts,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAllPage,
  onToggleSelectOne,
  onDelete,
  onRestore,
}: SalesContractListTableProps) {
  const columns = useMemo<DataTableColumn<SalesContract>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{
              input: { "aria-label": "Selecionar todos desta página" },
            }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => onToggleSelectAllPage()}
            onClick={stopRowNavigation}
          />
        ),
        render: (contract) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <Checkbox
              slotProps={{
                input: {
                  "aria-label": `Selecionar contrato #${contract.number}`,
                },
              }}
              checked={selectedIds.has(contract.id)}
              onChange={() => onToggleSelectOne(contract.id)}
            />
          </Box>
        ),
      },
      {
        id: "contract",
        header: "Contrato",
        render: (contract) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              #{contract.number}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
              {contract.customerName}
            </Typography>
          </Box>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (contract) => (
          <SalesContractStatusBadge statusId={contract.statusId} />
        ),
      },
      {
        id: "period",
        header: "Vigência",
        render: (contract) => (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatSalesContractDate(contract.startDate)}
            {" → "}
            {formatSalesContractDate(contract.endDate)}
          </Typography>
        ),
      },
      {
        id: "nextDue",
        header: "Próx. vencimento",
        render: (contract) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatSalesContractDate(contract.nextDueDate)}
          </Typography>
        ),
      },
      {
        id: "payment",
        header: "Pagamento",
        render: (contract) => (
          <PaymentStatusBadge status={contract.currentPaymentStatus} />
        ),
      },
      {
        id: "value",
        header: "Valor",
        render: (contract) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatSalesContractAmount(contract.totalAmount)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (contract) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <SalesContractRowActions
              contract={contract}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Box>
        ),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      selectedIds,
      onToggleSelectAllPage,
      onToggleSelectOne,
      onDelete,
      onRestore,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={contracts}
      getRowId={(contract) => contract.id}
      emptyMessage="Nenhum contrato encontrado."
      getRowHref={(contract) =>
        contract.deletedAt
          ? undefined
          : `/vendas/contratos-de-vendas/${contract.id}`
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
