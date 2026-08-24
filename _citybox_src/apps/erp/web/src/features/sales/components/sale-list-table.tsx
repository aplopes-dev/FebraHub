"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Checkbox, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { SaleRowActions } from "@/features/sales/components/sale-row-actions";
import { SaleOrderStatusBadge } from "@/features/sales-orders/components/sale-order-status-badge";
import { formatSaleOrderChannel } from "@/features/sales-orders/lib/sale-order-channels";
import {
  formatSaleOrderAmount,
  formatSaleOrderCreatedAt,
} from "@/features/sales-orders/services/sale-order-list.service";
import type { SaleOrder } from "@/features/sales-orders/types/sale-order";

type SaleListTableProps = {
  sales: SaleOrder[];
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
};

export function SaleListTable({
  sales,
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
}: SaleListTableProps) {
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
        render: (sale) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <Checkbox
              slotProps={{
                input: {
                  "aria-label": `Selecionar venda #${sale.number}`,
                },
              }}
              checked={selectedIds.has(sale.id)}
              onChange={() => onToggleSelectOne(sale.id)}
            />
          </Box>
        ),
      },
      {
        id: "sale",
        header: "Venda",
        render: (sale) => {
          const cancelled = sale.status === "cancelled";
          return (
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                ...(cancelled
                  ? {
                      color: "text.secondary",
                      textDecoration: "line-through",
                    }
                  : null),
              }}
            >
              {sale.customerName}
            </Typography>
          );
        },
      },
      {
        id: "number",
        header: "Nº do pedido",
        render: (sale) => (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
              ...(sale.status === "cancelled"
                ? { textDecoration: "line-through" }
                : null),
            }}
          >
            #{sale.number}
          </Typography>
        ),
      },
      {
        id: "value",
        header: "Valor",
        render: (sale) => (
          <Typography
            variant="body2"
            sx={{
              fontVariantNumeric: "tabular-nums",
              ...(sale.status === "cancelled"
                ? {
                    color: "text.secondary",
                    textDecoration: "line-through",
                  }
                : null),
            }}
          >
            {formatSaleOrderAmount(sale.totalAmount)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (sale) => <SaleOrderStatusBadge status={sale.status} />,
      },
      {
        id: "channel",
        header: "Canal de venda",
        render: (sale) => (
          <Typography
            variant="body2"
            noWrap
            sx={
              sale.status === "cancelled"
                ? { color: "text.secondary" }
                : undefined
            }
          >
            {formatSaleOrderChannel(sale.channelId)}
          </Typography>
        ),
      },
      {
        id: "createdAt",
        header: "Criação",
        render: (sale) => (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatSaleOrderCreatedAt(sale.createdAt)}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (sale) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <SaleRowActions sale={sale} onDelete={onDelete} />
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
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={sales}
      getRowId={(sale) => sale.id}
      emptyMessage="Nenhuma venda encontrada."
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
