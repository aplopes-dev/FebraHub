"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Checkbox, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { SaleOrderRowActions } from "@/features/sales-orders/components/sale-order-row-actions";
import { SaleOrderStatusBadge } from "@/features/sales-orders/components/sale-order-status-badge";
import { formatSaleOrderChannelWithFulfillment } from "@/features/sales-orders/lib/sale-order-channels";
import {
  formatSaleOrderAmount,
  formatSaleOrderCreatedAt,
} from "@/features/sales-orders/services/sale-order-list.service";
import type {
  SaleOrder,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderListTableProps = {
  orders: SaleOrder[];
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
  onChangeStatus: (id: string, status: SaleOrderStatus) => boolean;
  onDelete: (id: string) => boolean;
};

export function SaleOrderListTable({
  orders,
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
  onChangeStatus,
  onDelete,
}: SaleOrderListTableProps) {
  const columns = useMemo<DataTableColumn<SaleOrder>[]>(
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
        render: (order) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <Checkbox
              slotProps={{
                input: {
                  "aria-label": `Selecionar pedido #${order.number}`,
                },
              }}
              checked={selectedIds.has(order.id)}
              onChange={() => onToggleSelectOne(order.id)}
            />
          </Box>
        ),
      },
      {
        id: "order",
        header: "Pedido",
        render: (order) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                ...(order.status === "cancelled"
                  ? {
                      color: "text.secondary",
                      textDecoration: "line-through",
                    }
                  : null),
              }}
            >
              #{order.number}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",
                ...(order.status === "cancelled"
                  ? { textDecoration: "line-through" }
                  : null),
              }}
            >
              {order.customerName}
            </Typography>
          </Box>
        ),
      },
      {
        id: "value",
        header: "Valor",
        render: (order) => (
          <Typography
            variant="body2"
            sx={{
              fontVariantNumeric: "tabular-nums",
              ...(order.status === "cancelled"
                ? {
                    color: "text.secondary",
                    textDecoration: "line-through",
                  }
                : null),
            }}
          >
            {formatSaleOrderAmount(order.totalAmount)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (order) => <SaleOrderStatusBadge status={order.status} />,
      },
      {
        id: "createdBy",
        header: "Criado por",
        render: (order) => (
          <Typography variant="body2" noWrap>
            {order.createdBy}
          </Typography>
        ),
      },
      {
        id: "channel",
        header: "Canais de venda",
        render: (order) => (
          <Typography variant="body2" noWrap>
            {formatSaleOrderChannelWithFulfillment(
              order.channelId,
              order.posDeliveryFulfillment,
            )}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        header: "Criado em",
        render: (order) => (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatSaleOrderCreatedAt(order.createdAt)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (order) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <SaleOrderRowActions
              order={order}
              onChangeStatus={onChangeStatus}
              onDelete={onDelete}
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
      onChangeStatus,
      onDelete,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={orders}
      getRowId={(order) => order.id}
      emptyMessage="Nenhum pedido de venda encontrado."
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
