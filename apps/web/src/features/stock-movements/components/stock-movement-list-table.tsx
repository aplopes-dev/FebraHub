"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StockMovementRowActions } from "@/features/stock-movements/components/stock-movement-row-actions";
import { StockMovementTypeBadge } from "@/features/stock-movements/components/stock-movement-type-badge";
import {
  formatCurrencyBRL,
  formatOperatedAt,
} from "@/features/stock-movements/lib/stock-movement-form-values";
import type { StockMovementListItem } from "@/features/stock-movements/types/stock-movement";
import { resolveStockMovementReasonLabel } from "@/features/stock-movements/types/stock-movement-reason";

type StockMovementListTableProps = {
  movements: StockMovementListItem[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (movement: StockMovementListItem) => void;
  isLoading?: boolean;
};

export function StockMovementListTable({
  movements,
  pageIndex,
  pageCount: _pageCount,
  totalRowCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  onView,
  isLoading = false,
}: StockMovementListTableProps) {
  const columns = useMemo<DataTableColumn<StockMovementListItem>[]>(
    () => [
      {
        id: "operatedAt",
        header: "Data",
        render: (movement) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatOperatedAt(movement.operatedAt)}
          </Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        render: (movement) => (
          <StockMovementTypeBadge type={movement.type} />
        ),
      },
      {
        id: "reason",
        header: "Motivo",
        render: (movement) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {resolveStockMovementReasonLabel(movement)}
          </Typography>
        ),
      },
      {
        id: "warehouse",
        header: "Estoque",
        render: (movement) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {movement.warehouseName}
          </Typography>
        ),
      },
      {
        id: "items",
        header: "Itens",
        render: (movement) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {movement.itemsCount}
          </Typography>
        ),
      },
      {
        id: "totalCost",
        header: "Total custo",
        render: (movement) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRL(movement.totalCost)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (movement) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <StockMovementRowActions movement={movement} onView={onView} />
          </Box>
        ),
      },
    ],
    [onView],
  );

  return (
    <DataTable
      columns={columns}
      rows={movements}
      getRowId={(movement) => movement.id}
      emptyMessage="Nenhuma movimentação encontrada."
      onRowClick={onView}
      isLoading={isLoading}
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
