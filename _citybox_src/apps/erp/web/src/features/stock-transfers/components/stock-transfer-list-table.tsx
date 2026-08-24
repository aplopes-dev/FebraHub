"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StockTransferRowActions } from "@/features/stock-transfers/components/stock-transfer-row-actions";
import { formatOperatedAt } from "@/features/stock-transfers/lib/stock-transfer-form-values";
import type { StockTransferListItem } from "@/features/stock-transfers/types/stock-transfer";

type StockTransferListTableProps = {
  transfers: StockTransferListItem[];
  pageIndex: number;
  totalRowCount: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onCancel: (id: string) => Promise<boolean>;
  isCancelling?: boolean;
  isLoading?: boolean;
};

export function StockTransferListTable({
  transfers,
  pageIndex,
  totalRowCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onCancel,
  isCancelling = false,
  isLoading = false,
}: StockTransferListTableProps) {
  const columns = useMemo<DataTableColumn<StockTransferListItem>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        render: (transfer) => (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {transfer.id}
          </Typography>
        ),
      },
      {
        id: "operatedAt",
        header: "Data",
        render: (transfer) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatOperatedAt(transfer.operatedAt)}
          </Typography>
        ),
      },
      {
        id: "from",
        header: "Estoque saída",
        render: (transfer) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {transfer.fromWarehouseName}
          </Typography>
        ),
      },
      {
        id: "to",
        header: "Estoque entrada",
        render: (transfer) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {transfer.toWarehouseName}
          </Typography>
        ),
      },
      {
        id: "responsible",
        header: "Responsável",
        render: (transfer) => (
          <Typography variant="body2">
            {transfer.responsibleName || "—"}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (transfer) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <StockTransferRowActions
              transfer={transfer}
              onCancel={onCancel}
              isCancelling={isCancelling}
            />
          </Box>
        ),
      },
    ],
    [onCancel, isCancelling],
  );

  return (
    <DataTable
      columns={columns}
      rows={transfers}
      getRowId={(transfer) => transfer.id}
      emptyMessage="Nenhuma transferência encontrada."
      isLoading={isLoading}
      sx={{ minHeight: 0, flex: 1 }}
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
