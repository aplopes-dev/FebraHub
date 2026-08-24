"use client";

import { useMemo } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { ProductionStatusBadge } from "@/features/production/components/production-status-badge";
import { formatIsoDate } from "@/lib/date";
import type { ProductionOrder } from "@/features/production/types/production";

type ProductionOrderListTableProps = {
  orders: ProductionOrder[];
  emptyMessage?: string;
  onRowClick?: (order: ProductionOrder) => void;
  /** Quando fornecido, exibe a ação "Iniciar" para pedidos pendentes. */
  onStart?: (order: ProductionOrder) => void;
  pageIndex: number;
  totalRowCount: number;
  pageSize: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
};

export function ProductionOrderListTable({
  orders,
  emptyMessage = "Nenhum pedido de produção registrado.",
  onRowClick,
  onStart,
  pageIndex,
  totalRowCount,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  isLoading = false,
}: ProductionOrderListTableProps) {
  const columns = useMemo<DataTableColumn<ProductionOrder>[]>(
    () => [
      {
        id: "product",
        header: "Produto",
        render: (order) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {order.productName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {order.productSku}
            </Typography>
          </Box>
        ),
      },
      {
        id: "quantity",
        header: "Qtd. planejada",
        render: (order) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {order.plannedQuantity}
          </Typography>
        ),
      },
      {
        id: "flow",
        header: "Origem → Destino",
        render: (order) => (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", color: "text.secondary" }}
          >
            <Typography variant="body2" noWrap>
              {order.sourceStockName}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 14, flexShrink: 0 }} aria-hidden />
            <Typography variant="body2" noWrap>
              {order.destinationStockName}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "date",
        header: "Previsão",
        render: (order) => (
          <Typography variant="body2" color="text.secondary">
            {formatIsoDate(order.expectedDate)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (order) => <ProductionStatusBadge status={order.status} />,
      },
      ...(onStart
        ? [
            {
              id: "actions",
              header: "",
              width: 120,
              align: "right" as const,
              render: (order: ProductionOrder) =>
                order.status === "pending" ? (
                  <Box
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<PlayArrowIcon fontSize="small" />}
                      onClick={() => onStart(order)}
                    >
                      Iniciar
                    </Button>
                  </Box>
                ) : null,
            } satisfies DataTableColumn<ProductionOrder>,
          ]
        : []),
    ],
    [onStart],
  );

  return (
    <DataTable
      columns={columns}
      rows={orders}
      getRowId={(order) => order.id}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      isLoading={isLoading}
      sx={{ flex: 1, minHeight: 0 }}
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
