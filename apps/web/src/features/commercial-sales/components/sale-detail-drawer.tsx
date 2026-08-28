"use client";

import Link from "next/link";
import { Box, Button, Divider, Drawer, Stack, Typography } from "@/ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status";
import { OriginChip } from "@/features/pipeline/components/origin-chip";
import type { CommercialSaleRow } from "@/features/commercial-sales/types/sale-view";
import type { SaleInstallment } from "@/lib/mock-db";
import { formatIsoDate } from "@/lib/date";
import { formatCents, formatPercent } from "@/lib/money";

const INSTALLMENT_TONE = {
  paga: "success",
  aberta: "info",
  vencida: "error",
  estornada: "neutral",
} as const;

/**
 * O detalhe da venda.
 *
 * Mostra a composição do preço (tabela → desconto → praticado) e o plano de
 * parcelas em leitura. Parcela aqui é informação do Financeiro: o comercial
 * precisa vê-la para conversar com o aluno, não para alterá-la.
 */
export function SaleDetailDrawer({
  row,
  onClose,
  onApprove,
  onCancel,
  isBusy,
}: {
  row: CommercialSaleRow | null;
  onClose: () => void;
  onApprove: (saleId: string) => void;
  onCancel: (saleId: string) => void;
  isBusy?: boolean;
}) {
  const columns: DataTableColumn<SaleInstallment>[] = [
    { id: "number", header: "#", width: 48, render: (item) => item.number },
    { id: "due", header: "Vencimento", render: (item) => formatIsoDate(item.dueAt) },
    {
      id: "amount",
      header: "Valor",
      align: "right",
      render: (item) => formatCents(item.amountCents),
    },
    {
      id: "status",
      header: "Situação",
      render: (item) => (
        <SemanticBadge label={item.status} tone={INSTALLMENT_TONE[item.status]} />
      ),
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={Boolean(row)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 }, p: 3 } } }}
    >
      {row ? (
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {row.sale.number}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {row.productName}
              {row.editionName ? ` · ${row.editionName}` : " · turma a definir"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <SemanticBadge
              label={`Comercial: ${row.sale.commercialStatus.replace(/_/g, " ")}`}
              tone={
                row.sale.commercialStatus === "aprovada"
                  ? "success"
                  : row.sale.commercialStatus === "cancelada"
                    ? "error"
                    : "warning"
              }
            />
            <SemanticBadge
              label={`Financeiro: ${row.sale.financialStatus}`}
              tone={
                row.sale.financialStatus === "quitado"
                  ? "success"
                  : row.sale.financialStatus === "inadimplente"
                    ? "error"
                    : "info"
              }
            />
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Line label="Comprador (quem paga)" value={row.buyerName} />
            <Line
              label="Beneficiário (quem cursa)"
              value={row.beneficiaryName ?? row.buyerName}
            />
            <Line label="Vendedor" value={row.sellerName} />
            <Line label="Fechada em" value={formatIsoDate(row.sale.createdAt)} />
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Line label="Preço de tabela" value={formatCents(row.sale.listPriceCents)} />
            <Line
              label="Desconto"
              value={`${formatCents(row.sale.discountCents)} (${formatPercent(row.discountPercent)})`}
              tone={row.discountPercent > 15 ? "warning.dark" : undefined}
            />
            <Line
              label="Valor praticado"
              value={formatCents(row.sale.netCents)}
              strong
            />
            <Line label="Entrada" value={formatCents(row.sale.downPaymentCents)} />
            <Line
              label="Parcelamento"
              value={`${row.sale.installments}× · ${row.sale.paymentMethod.replace(/_/g, " ")}`}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              PLANO DE PARCELAS (LEITURA)
            </Typography>
            <DataTable
              columns={columns}
              rows={row.sale.installmentsPlan}
              getRowId={(item) => String(item.number)}
              emptyMessage="Sem parcelas."
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              ORIGEM
            </Typography>
            <Box>
              <OriginChip origin={row.sale.origin} />
            </Box>
            {row.sale.opportunityId ? (
              <Button
                component={Link}
                href={`/comercial/oportunidades/${row.sale.opportunityId}`}
                variant="text"
                size="small"
                sx={{ alignSelf: "flex-start" }}
              >
                Ver a oportunidade que gerou esta venda
              </Button>
            ) : null}
          </Stack>

          {row.sale.commercialStatus === "aguardando_aprovacao" ? (
            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="contained"
                color="success"
                disabled={isBusy}
                onClick={() => onApprove(row.sale.id)}
              >
                Aprovar venda
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                disabled={isBusy}
                onClick={() => onCancel(row.sale.id)}
              >
                Cancelar
              </Button>
            </Stack>
          ) : null}

          {row.sale.cancelReason ? (
            <Typography variant="caption" sx={{ color: "error.dark" }}>
              Cancelada: {row.sale.cancelReason}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  );
}

function Line({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: string;
}) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: strong ? 700 : 500, color: tone ?? "text.primary" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
