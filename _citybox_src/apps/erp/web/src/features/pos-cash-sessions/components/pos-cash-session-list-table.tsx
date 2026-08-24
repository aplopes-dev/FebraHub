"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { Typography } from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  formatCurrencyBRL,
  formatDateTimeBR,
} from "@/features/pos-cash-sessions/lib/pos-cash-session-format";
import type { PosCashSession } from "@/features/pos-cash-sessions/types/pos-cash-session";

type PosCashSessionListTableProps = {
  sessions: PosCashSession[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpenSales: (session: PosCashSession) => void;
};

export function PosCashSessionListTable({
  sessions,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpenSales,
}: PosCashSessionListTableProps) {
  const columns = useMemo<DataTableColumn<PosCashSession>[]>(
    () => [
      {
        id: "pdv",
        header: "PDV",
        render: (session) => (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {session.posRegisterName}
          </Typography>
        ),
      },
      {
        id: "caixa",
        header: "Caixa",
        render: (session) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {session.cashBoxLabel}
          </Typography>
        ),
      },
      {
        id: "abertura",
        header: "Abertura",
        render: (session) => (
          <Typography variant="body2" noWrap>
            {formatDateTimeBR(session.openedAt)}
          </Typography>
        ),
      },
      {
        id: "operador",
        header: "Operador",
        render: (session) => (
          <Typography variant="body2" noWrap>
            {session.operatorName}
          </Typography>
        ),
      },
      {
        id: "vendedor",
        header: "Vendedor",
        render: (session) => (
          <Typography variant="body2" noWrap>
            {session.sellerName}
          </Typography>
        ),
      },
      {
        id: "fechamento",
        header: "Fechamento",
        render: (session) => (
          <Typography
            variant="body2"
            noWrap
            sx={{ color: session.closedAt ? "text.primary" : "warning.dark" }}
          >
            {formatDateTimeBR(session.closedAt)}
          </Typography>
        ),
      },
      {
        id: "saldo-inicial",
        header: "Saldo inicial",
        render: (session) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(session.openingBalanceCents)}
          </Typography>
        ),
      },
      {
        id: "saldo-final",
        header: "Saldo final",
        render: (session) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {session.closingBalanceCents != null
              ? formatCurrencyBRL(session.closingBalanceCents)
              : "—"}
          </Typography>
        ),
      },
      {
        id: "recebimentos",
        header: "Recebimentos",
        render: (session) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(session.declaredReceiptsCents)}
          </Typography>
        ),
      },
      {
        id: "vendas",
        header: "Vendas",
        render: (session) => (
          <Box>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onOpenSales(session)}
              sx={{
                typography: "body2",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                cursor: "pointer",
              }}
            >
              {session.salesCount}
            </Link>
          </Box>
        ),
      },
      {
        id: "sangrias",
        header: "Sangrias",
        render: (session) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {session.withdrawalCount}
          </Typography>
        ),
      },
    ],
    [onOpenSales],
  );

  return (
    <DataTable
      columns={columns}
      rows={sessions}
      getRowId={(session) => session.id}
      emptyMessage="Nenhuma sessão de caixa encontrada para os filtros."
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
