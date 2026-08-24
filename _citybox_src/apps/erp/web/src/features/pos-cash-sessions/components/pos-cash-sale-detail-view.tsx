"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  formatCurrencyBRL,
  formatDateTimeBR,
  formatPosCashSaleCode,
} from "@/features/pos-cash-sessions/lib/pos-cash-session-format";
import type { PosCashSale } from "@/features/pos-cash-sessions/types/pos-cash-session";

type PosCashSaleDetailViewProps = {
  sale: PosCashSale;
};

const productColumns: DataTableColumn<{
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}>[] = [
  {
    id: "product",
    header: "Produto",
    render: (row) => (
      <Typography variant="body2" noWrap>
        {row.productName}
      </Typography>
    ),
  },
  {
    id: "qty",
    header: "Quantidade",
    render: (row) => (
      <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {row.quantity}
      </Typography>
    ),
  },
  {
    id: "unit",
    header: "Valor unitário",
    render: (row) => (
      <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {formatCurrencyBRL(row.unitPriceCents)}
      </Typography>
    ),
  },
  {
    id: "total",
    header: "Total",
    render: (row) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
      >
        {formatCurrencyBRL(row.totalCents)}
      </Typography>
    ),
  },
];

const paymentColumns: DataTableColumn<{
  id: string;
  paidAt: string;
  method: string;
  amountCents: number;
}>[] = [
  {
    id: "date",
    header: "Data",
    render: (row) => (
      <Typography variant="body2" noWrap>
        {formatDateTimeBR(row.paidAt)}
      </Typography>
    ),
  },
  {
    id: "method",
    header: "Método de pagamento",
    render: (row) => <Typography variant="body2">{row.method}</Typography>,
  },
  {
    id: "amount",
    header: "Valor",
    render: (row) => (
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
      >
        {formatCurrencyBRL(row.amountCents)}
      </Typography>
    ),
  },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export function PosCashSaleDetailView({ sale }: PosCashSaleDetailViewProps) {
  return (
    <Stack spacing={3} sx={{ pb: 1 }}>
      <Box>
        <SectionTitle>Informações da venda</SectionTitle>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <InfoItem label="Código" value={formatPosCashSaleCode(sale)} />
          <InfoItem label="Cliente" value={sale.customerName} />
          <InfoItem label="Vendedor" value={sale.sellerName} />
          <InfoItem label="Operador" value={sale.operatorName} />
          <InfoItem label="Data" value={formatDateTimeBR(sale.endedAt)} />
          <InfoItem label="Status" value={sale.statusLabel} />
        </Box>
      </Box>

      <Box>
        <SectionTitle>Produtos da venda</SectionTitle>
        <DataTable
          rows={sale.products}
          columns={productColumns}
          getRowId={(row) => row.id}
          emptyMessage="Nenhum produto nesta venda."
        />
        <Stack
          direction="row"
          sx={{ justifyContent: "flex-end", mt: 1.5, pr: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Total: {formatCurrencyBRL(sale.amountCents)}
          </Typography>
        </Stack>
      </Box>

      <Box>
        <SectionTitle>Pagamentos</SectionTitle>
        <DataTable
          rows={sale.payments}
          columns={paymentColumns}
          getRowId={(row) => row.id}
          emptyMessage="Nenhum pagamento registrado."
        />
      </Box>
    </Stack>
  );
}
