"use client";

import { useState } from "react";
import {
  Avatar,
  Grid,
  MenuItem,
  PageHeader,
  Paper,
  SearchInput,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@/ui";
import { DataTable, ListPagePanel, type DataTableColumn } from "@/components/ui/data-table";
import { Page } from "@/components/ui/page";
import { SemanticBadge, type SemanticTone } from "@/components/ui/status";
import { SaleDetailDrawer } from "@/features/commercial-sales/components/sale-detail-drawer";
import {
  useApproveSaleMutation,
  useCancelSaleMutation,
  useSalesBoard,
} from "@/features/commercial-sales/hooks/use-commercial-sales";
import type {
  CommercialSaleRow,
  SalesTab,
} from "@/features/commercial-sales/types/sale-view";
import { formatIsoDate } from "@/lib/date";
import { formatCents, formatCentsCompact, formatPercent } from "@/lib/money";

const TABS: Array<{ id: SalesTab; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { id: "aprovada", label: "Aprovadas" },
  { id: "cancelada", label: "Canceladas" },
];

const COMMERCIAL_TONE: Record<string, SemanticTone> = {
  aguardando_aprovacao: "warning",
  aprovada: "success",
  cancelada: "error",
};

const FINANCIAL_TONE: Record<string, SemanticTone> = {
  pendente: "info",
  parcial: "info",
  quitado: "success",
  inadimplente: "error",
  estornado: "neutral",
};

/**
 * Vendas do comercial — a venda educacional.
 *
 * Não é a listagem de varejo da Loja: aqui existe **comprador ≠ beneficiário**,
 * turma, preço de tabela contra praticado, e dois status que não se misturam.
 */
export function CommercialSalesPage() {
  const { filters, patchFilters, search, setSearch, board, isLoading } = useSalesBoard();
  const approveMutation = useApproveSaleMutation();
  const cancelMutation = useCancelSaleMutation();
  const [selected, setSelected] = useState<CommercialSaleRow | null>(null);

  const columns: DataTableColumn<CommercialSaleRow>[] = [
    {
      id: "number",
      header: "Venda",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.sale.number}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatIsoDate(row.sale.createdAt)}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "buyer",
      header: "Comprador / beneficiário",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.buyerName}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.beneficiaryName
              ? `cursa: ${row.beneficiaryName}`
              : "cursa a própria pessoa"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "product",
      header: "Produto / turma",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.productName}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.editionName ?? "turma a definir"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "price",
      header: "Tabela × praticado",
      align: "right",
      render: (row) => (
        <Stack spacing={0.25} sx={{ alignItems: "flex-end" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCents(row.sale.netCents)}
          </Typography>
          <Tooltip title={`Tabela ${formatCents(row.sale.listPriceCents)}`} arrow>
            <Typography
              variant="caption"
              sx={{ color: row.discountPercent > 15 ? "warning.dark" : "text.disabled" }}
            >
              {row.discountPercent > 0
                ? `−${formatPercent(row.discountPercent)}`
                : "sem desconto"}
            </Typography>
          </Tooltip>
        </Stack>
      ),
    },
    {
      id: "commercial",
      header: "Comercial",
      render: (row) => (
        <SemanticBadge
          label={row.sale.commercialStatus.replace(/_/g, " ")}
          tone={COMMERCIAL_TONE[row.sale.commercialStatus] ?? "neutral"}
        />
      ),
    },
    {
      id: "financial",
      header: "Financeiro",
      render: (row) => (
        <Stack spacing={0.25}>
          <SemanticBadge
            label={row.sale.financialStatus}
            tone={FINANCIAL_TONE[row.sale.financialStatus] ?? "neutral"}
          />
          {row.overdueCount > 0 ? (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {row.overdueCount} parcela(s) vencida(s)
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      id: "seller",
      header: "Vendedor",
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 26, height: 26, fontSize: "0.6875rem" }}>
            {row.sellerInitials}
          </Avatar>
          <Typography variant="body2" noWrap>
            {row.sellerName}
          </Typography>
        </Stack>
      ),
    },
  ];

  return (
    <Page scroll={false}>
      <PageHeader
        title="Vendas"
        description="Matrículas fechadas. Status comercial e financeiro são coisas diferentes."
      />

      {board ? (
        <Grid container spacing={2}>
          <Summary
            label="Praticado (não canceladas)"
            value={formatCentsCompact(board.summary.netCents)}
            hint={`Tabela somava ${formatCentsCompact(board.summary.listCents)}`}
          />
          <Summary
            label="Desconto médio"
            value={formatPercent(board.summary.discountPercent)}
            hint="Sobre o preço de tabela"
            tone={board.summary.discountPercent > 15 ? "warning" : "neutral"}
          />
          <Summary
            label="Aguardando aprovação"
            value={String(board.summary.awaitingApproval)}
            hint="Fechadas e ainda não liberadas"
            tone={board.summary.awaitingApproval > 0 ? "warning" : "neutral"}
          />
          <Summary
            label="Com parcela vencida"
            value={String(board.summary.overdue)}
            hint="Informação do Financeiro"
            tone={board.summary.overdue > 0 ? "warning" : "neutral"}
          />
        </Grid>
      ) : null}

      <ListPagePanel sx={{ gap: 2 }}>
        <Tabs
          value={filters.tab}
          onChange={(_event, value) => patchFilters({ tab: value as SalesTab })}
          variant="scrollable"
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={`${tab.label} (${board?.tabCounts[tab.id] ?? 0})`}
            />
          ))}
        </Tabs>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, pessoa ou produto…"
            sx={{ width: "100%", maxWidth: 320 }}
            slotProps={{ htmlInput: { "aria-label": "Buscar vendas" } }}
          />
          <Select
            size="small"
            value={filters.financial}
            onChange={(event) =>
              patchFilters({ financial: event.target.value as typeof filters.financial })
            }
            sx={{ minWidth: 190 }}
            inputProps={{ "aria-label": "Status financeiro" }}
          >
            <MenuItem value="todos">Todo status financeiro</MenuItem>
            <MenuItem value="pendente">Pendente</MenuItem>
            <MenuItem value="parcial">Parcial</MenuItem>
            <MenuItem value="quitado">Quitado</MenuItem>
            <MenuItem value="inadimplente">Inadimplente</MenuItem>
            <MenuItem value="estornado">Estornado</MenuItem>
          </Select>
        </Stack>

        <DataTable
          columns={columns}
          rows={board?.rows ?? []}
          getRowId={(row) => row.sale.id}
          isLoading={isLoading}
          onRowClick={(row) => setSelected(row)}
          emptyMessage="Nenhuma venda neste recorte."
          pageScroll
        />
      </ListPagePanel>

      <SaleDetailDrawer
        row={selected}
        isBusy={approveMutation.isPending || cancelMutation.isPending}
        onClose={() => setSelected(null)}
        onApprove={(saleId) => {
          approveMutation.mutate(saleId);
          setSelected(null);
        }}
        onCancel={(saleId) => {
          cancelMutation.mutate({
            saleId,
            reason: "Cancelada pelo comercial.",
          });
          setSelected(null);
        }}
      />
    </Page>
  );
}

function Summary({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
              color: tone === "warning" ? "warning.dark" : "text.primary",
            }}
          >
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {hint}
          </Typography>
        </Stack>
      </Paper>
    </Grid>
  );
}
