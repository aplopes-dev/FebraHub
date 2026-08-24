"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import { Badge, Checkbox, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { ServiceOrderRowActions } from "@/features/service-orders/components/service-order-row-actions";
import { ServiceOrderStatusBadge } from "@/features/service-orders/components/service-order-status-badge";
import { getServiceOrderStatusById } from "@/features/service-orders/services/service-order-status.service";
import {
  computeOrderTotal,
  formatCurrencyBRL,
  formatDateTimeBR,
  isOverdue,
} from "@/features/service-orders/lib/service-order-totals";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";

type ServiceOrderListTableProps = {
  orders: ServiceOrder[];
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
  onEdit: (order: ServiceOrder) => void;
  onGenerateSale: (order: ServiceOrder) => void;
  onCancel: (order: ServiceOrder) => void;
};

function equipmentSummary(order: ServiceOrder): string {
  const first = order.equipments[0];
  if (!first) return "—";
  if (order.equipments.length === 1) return first.name;
  return `${first.name} +${order.equipments.length - 1}`;
}

function orderIsFinished(order: ServiceOrder): boolean {
  const baseType = getServiceOrderStatusById(order.statusId)?.baseType;
  return baseType === "closed" || baseType === "canceled";
}

export function ServiceOrderListTable({
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
  onEdit,
  onGenerateSale,
  onCancel,
}: ServiceOrderListTableProps) {
  const columns = useMemo<DataTableColumn<ServiceOrder>[]>(
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
                input: { "aria-label": `Selecionar ${order.code}` },
              }}
              checked={selectedIds.has(order.id)}
              onChange={() => onToggleSelectOne(order.id)}
            />
          </Box>
        ),
      },
      {
        id: "order",
        header: "OS",
        render: (order) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {order.code}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
              {order.customerName}
            </Typography>
          </Box>
        ),
      },
      {
        id: "equipment",
        header: "Equipamento",
        render: (order) => (
          <Typography variant="body2" noWrap>
            {equipmentSummary(order)}
          </Typography>
        ),
      },
      {
        id: "technician",
        header: "Técnico",
        render: (order) => (
          <Typography variant="body2" noWrap>
            {order.technicianName || "—"}
          </Typography>
        ),
      },
      {
        id: "dueAt",
        header: "Prazo",
        render: (order) => {
          if (!order.dueAt) {
            return (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Sem prazo
              </Typography>
            );
          }
          const overdue = isOverdue(order.dueAt, orderIsFinished(order));
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatDateTimeBR(order.dueAt)}
              </Typography>
              {overdue ? (
                <Badge
                  label="Vencido"
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: (theme) =>
                      alpha(theme.palette.error.main, 0.35),
                    bgcolor: "error.light",
                    color: "error.dark",
                    fontWeight: 500,
                    height: 20,
                    "& .MuiChip-label": { px: 0.75, fontSize: "0.75rem" },
                  }}
                />
              ) : null}
            </Stack>
          );
        },
      },
      {
        id: "total",
        header: "Total",
        render: (order) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(computeOrderTotal(order))}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (order) => (
          <ServiceOrderStatusBadge statusId={order.statusId} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (order) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <ServiceOrderRowActions
              order={order}
              onEdit={onEdit}
              onGenerateSale={onGenerateSale}
              onCancel={onCancel}
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
      onEdit,
      onGenerateSale,
      onCancel,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={orders}
      getRowId={(order) => order.id}
      emptyMessage="Nenhuma ordem de serviço encontrada."
      getRowHref={(order) => `/vendas/ordem-de-servicos/${order.id}`}
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
