"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Checkbox } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PurchaseRowActions } from "@/features/purchases/components/purchase-row-actions";
import { PurchaseStatusBadge } from "@/features/purchases/components/purchase-status-badge";
import {
  formatCurrencyBRL,
  formatRegisteredAt,
} from "@/features/purchases/lib/purchase-form-values";
import type { PurchaseListItem } from "@/features/purchases/types/purchase";

type PurchaseListTableProps = {
  purchases: PurchaseListItem[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectOne: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onRestore: (id: string) => Promise<boolean>;
  isDeleting?: boolean;
  isRestoring?: boolean;
  isLoading?: boolean;
};

export function PurchaseListTable({
  purchases,
  pageIndex,
  pageCount: _pageCount,
  totalRowCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAllPage,
  onToggleSelectOne,
  onDelete,
  onRestore,
  isDeleting = false,
  isRestoring = false,
  isLoading = false,
}: PurchaseListTableProps) {
  const columns = useMemo<DataTableColumn<PurchaseListItem>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{
              input: { "aria-label": "Selecionar todas desta página" },
            }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => onToggleSelectAllPage()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        render: (purchase) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Checkbox
              slotProps={{
                input: { "aria-label": `Selecionar ${purchase.id}` },
              }}
              checked={selectedIds.has(purchase.id)}
              onChange={() => onToggleSelectOne(purchase.id)}
            />
          </Box>
        ),
      },
      {
        id: "purchase",
        header: "Compra",
        render: (purchase) => {
          const invoiceLabel =
            purchase.invoiceNumber.trim().length > 0
              ? `NF ${purchase.invoiceNumber}`
              : "Sem NF";
          const series =
            purchase.series.trim().length > 0
              ? ` · Série ${purchase.series}`
              : "";
          return (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {invoiceLabel}
                {series}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                {purchase.supplierName}
              </Typography>
            </Box>
          );
        },
      },
      {
        id: "value",
        header: "Valor",
        render: (purchase) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRL(purchase.totalAmount)}
          </Typography>
        ),
      },
      {
        id: "registeredAt",
        header: "Registrado em",
        render: (purchase) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatRegisteredAt(purchase.createdAt)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (purchase) => (
          <PurchaseStatusBadge status={purchase.deliveryStatus} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (purchase) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PurchaseRowActions
              purchase={purchase}
              onDelete={onDelete}
              onRestore={onRestore}
              isDeleting={isDeleting}
              isRestoring={isRestoring}
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
      isDeleting,
      isRestoring,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={purchases}
      getRowId={(purchase) => purchase.id}
      emptyMessage="Nenhuma compra encontrada."
      isLoading={isLoading}
      pagination={{
        page: pageIndex + 1,
        perPage: pageSize,
        total: totalRowCount,
        onPageChange: (page) => onPageIndexChange(page - 1),
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
