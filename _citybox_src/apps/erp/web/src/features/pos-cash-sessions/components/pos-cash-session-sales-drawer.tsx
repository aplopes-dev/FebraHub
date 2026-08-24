"use client";

import { useEffect, useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  Button,
  Drawer,
  IconButton,
  ScrollArea,
  Tab,
  Tabs,
  Typography,
} from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PosCashClosingReportView } from "@/features/pos-cash-sessions/components/pos-cash-closing-report-view";
import { PosCashSaleDetailView } from "@/features/pos-cash-sessions/components/pos-cash-sale-detail-view";
import {
  formatCurrencyBRL,
  formatDateTimeBR,
  formatPosCashSaleCode,
} from "@/features/pos-cash-sessions/lib/pos-cash-session-format";
import {
  usePosCashClosingReportQuery,
  usePosCashMovementsQuery,
  usePosCashSaleQuery,
  usePosCashSalesQuery,
} from "@/features/pos-cash-sessions/hooks/use-pos-cash-session-queries";
import type {
  PosCashMovement,
  PosCashSale,
  PosCashSession,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

type DrawerTab = "sales" | "movements";

type DrawerView =
  | { kind: "list"; tab: DrawerTab }
  | { kind: "sale-detail"; saleId: string }
  | { kind: "closing-report" };

type PosCashSessionSalesDrawerProps = {
  session: PosCashSession | null;
  onOpenChange: (open: boolean) => void;
};

const SALES_PER_PAGE = 8;

function movementTypeLabel(type: PosCashMovement["type"]): string {
  return type === "withdrawal" ? "Sangria" : "Reforço";
}

export function PosCashSessionSalesDrawer({
  session,
  onOpenChange,
}: PosCashSessionSalesDrawerProps) {
  const [view, setView] = useState<DrawerView>({ kind: "list", tab: "sales" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setView({ kind: "list", tab: "sales" });
    setPage(1);
  }, [session?.id]);

  const sessionId = session?.id ?? null;
  const listTab = view.kind === "list" ? view.tab : "sales";

  const salesQuery = usePosCashSalesQuery(
    {
      sessionId: sessionId ?? "",
      page,
      perPage: SALES_PER_PAGE,
    },
    Boolean(session) && listTab === "sales",
  );

  const movementsQuery = usePosCashMovementsQuery(
    sessionId,
    Boolean(session) && (listTab === "movements" || view.kind === "list"),
  );

  const saleDetailQuery = usePosCashSaleQuery(
    sessionId,
    view.kind === "sale-detail" ? view.saleId : null,
    view.kind === "sale-detail",
  );

  const closingReportQuery = usePosCashClosingReportQuery(
    sessionId,
    view.kind === "closing-report",
  );

  const salesResult = salesQuery.data ?? {
    data: [] as PosCashSale[],
    meta: { total: 0, page: 1, perPage: SALES_PER_PAGE, totalPages: 0 },
  };

  const movements = movementsQuery.data ?? [];

  const withdrawalTotalCents = useMemo(
    () =>
      movements
        .filter((m) => m.type === "withdrawal")
        .reduce((sum, m) => sum + m.amountCents, 0),
    [movements],
  );

  const saleDetail = saleDetailQuery.data ?? null;
  const closingReport = closingReportQuery.data ?? null;

  const salesColumns = useMemo<DataTableColumn<PosCashSale>[]>(
    () => [
      {
        id: "id",
        header: "Código",
        render: (sale) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
          >
            {formatPosCashSaleCode(sale)}
          </Typography>
        ),
      },
      {
        id: "customer",
        header: "Cliente",
        render: (sale) => (
          <Typography variant="body2" noWrap>
            {sale.customerName}
          </Typography>
        ),
      },
      {
        id: "start",
        header: "Início",
        render: (sale) => (
          <Typography variant="body2" noWrap>
            {formatDateTimeBR(sale.startedAt)}
          </Typography>
        ),
      },
      {
        id: "end",
        header: "Fim",
        render: (sale) => (
          <Typography variant="body2" noWrap>
            {formatDateTimeBR(sale.endedAt)}
          </Typography>
        ),
      },
      {
        id: "amount",
        header: "Valor",
        render: (sale) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(sale.amountCents)}
          </Typography>
        ),
      },
      {
        id: "method",
        header: "Método",
        render: (sale) => (
          <Typography variant="body2" noWrap>
            {sale.paymentMethod}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 48,
        render: (sale) => (
          <IconButton
            size="small"
            aria-label={`Ver detalhes da venda ${formatPosCashSaleCode(sale)}`}
            onClick={() => setView({ kind: "sale-detail", saleId: sale.id })}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [],
  );

  const movementColumns = useMemo<DataTableColumn<PosCashMovement>[]>(
    () => [
      {
        id: "type",
        header: "Tipo",
        render: (movement) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {movementTypeLabel(movement.type)}
          </Typography>
        ),
      },
      {
        id: "at",
        header: "Horário",
        render: (movement) => (
          <Typography variant="body2" noWrap>
            {formatDateTimeBR(movement.at)}
          </Typography>
        ),
      },
      {
        id: "amount",
        header: "Valor",
        render: (movement) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(movement.amountCents)}
          </Typography>
        ),
      },
      {
        id: "reason",
        header: "Motivo",
        render: (movement) => (
          <Typography variant="body2" noWrap>
            {movement.reason}
          </Typography>
        ),
      },
      {
        id: "operator",
        header: "Operador",
        render: (movement) => (
          <Typography variant="body2" noWrap>
            {movement.operatorName}
          </Typography>
        ),
      },
      {
        id: "authorizedBy",
        header: "Autorizou",
        render: (movement) => (
          <Typography variant="body2" noWrap color="text.secondary">
            {movement.authorizedByName ?? "—"}
          </Typography>
        ),
      },
    ],
    [],
  );

  const title = (() => {
    if (!session) return undefined;
    if (view.kind === "sale-detail") {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <IconButton
            size="small"
            aria-label="Voltar para vendas"
            onClick={() => setView({ kind: "list", tab: "sales" })}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Detalhe da venda
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {saleDetail
                ? formatPosCashSaleCode(saleDetail)
                : formatPosCashSaleCode(view.saleId)}
            </Typography>
          </Box>
        </Stack>
      );
    }
    if (view.kind === "closing-report") {
      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <IconButton
            size="small"
            aria-label="Voltar para o caixa"
            onClick={() => setView({ kind: "list", tab: "sales" })}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Valores de fechamento
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.posRegisterName} · {session.cashBoxLabel}
            </Typography>
          </Box>
        </Stack>
      );
    }
    return (
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Sessão de caixa
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {session.posRegisterName} · {session.cashBoxLabel} · Operador{" "}
          {session.operatorName} · {formatDateTimeBR(session.openedAt)}
        </Typography>
      </Box>
    );
  })();

  return (
    <Drawer
      open={session != null}
      onClose={() => onOpenChange(false)}
      title={title}
      width={880}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          {view.kind !== "list" ? (
            <Button
              type="button"
              variant="outlined"
              onClick={() => setView({ kind: "list", tab: "sales" })}
            >
              Voltar
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outlined"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </Stack>
      }
    >
      {session ? (
        <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
          {view.kind === "list" ? (
            <Stack spacing={2}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Tabs
                  value={listTab}
                  onChange={(_, next: DrawerTab) => {
                    setView({ kind: "list", tab: next });
                    if (next === "sales") setPage(1);
                  }}
                  sx={{
                    minHeight: 40,
                    "& .MuiTabs-indicator": { height: 2 },
                  }}
                >
                  <Tab
                    value="sales"
                    label={`Vendas (${session.salesCount})`}
                    sx={{ minHeight: 40, textTransform: "none" }}
                  />
                  <Tab
                    value="movements"
                    label={`Sangrias / movimentos (${movements.length})`}
                    sx={{ minHeight: 40, textTransform: "none" }}
                  />
                </Tabs>
                <Button
                  type="button"
                  variant="contained"
                  onClick={() => setView({ kind: "closing-report" })}
                >
                  Valores de fechamento
                </Button>
              </Stack>

              {listTab === "sales" ? (
                <DataTable
                  rows={salesResult.data}
                  columns={salesColumns}
                  getRowId={(sale) => sale.id}
                  emptyMessage={
                    salesQuery.isLoading
                      ? "Carregando vendas…"
                      : "Nenhuma venda nesta sessão de caixa."
                  }
                  pagination={{
                    page: salesResult.meta.page,
                    perPage: salesResult.meta.perPage,
                    total: salesResult.meta.total,
                    onPageChange: setPage,
                  }}
                />
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Total em sangrias:{" "}
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCurrencyBRL(withdrawalTotalCents)}
                    </Box>
                  </Typography>
                  <DataTable
                    rows={movements}
                    columns={movementColumns}
                    getRowId={(movement) => movement.id}
                    emptyMessage={
                      movementsQuery.isLoading
                        ? "Carregando movimentos…"
                        : "Nenhuma sangria ou reforço nesta sessão."
                    }
                  />
                </Stack>
              )}
            </Stack>
          ) : null}

          {view.kind === "sale-detail" ? (
            saleDetailQuery.isLoading ? (
              <Typography variant="body2" color="text.secondary">
                Carregando venda…
              </Typography>
            ) : saleDetail ? (
              <PosCashSaleDetailView sale={saleDetail} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Venda não encontrada.
              </Typography>
            )
          ) : null}

          {view.kind === "closing-report" ? (
            closingReportQuery.isLoading ? (
              <Typography variant="body2" color="text.secondary">
                Carregando comprovante…
              </Typography>
            ) : closingReport ? (
              <PosCashClosingReportView report={closingReport} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Não foi possível montar o comprovante.
              </Typography>
            )
          ) : null}
        </ScrollArea>
      ) : null}
    </Drawer>
  );
}
