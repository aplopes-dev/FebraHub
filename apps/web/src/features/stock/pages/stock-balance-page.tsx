"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { MenuItem, ScrollArea, SearchInput, Select } from "@/ui";
import { EntityFormHeader } from "@/components/ui/form/entity-form-header";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { StockBalanceTable } from "@/features/stock/components/stock-balance-table";
import { ProductMovementsDrawer } from "@/features/stock/components/product-movements-drawer";
import { useStockQuery } from "@/features/stock/hooks/use-stock-queries";
import { useStockBalanceQuery } from "@/features/stock-movements/hooks/use-stock-movement-queries";
import {
  STOCK_BALANCE_STATUS_LABELS,
  type StockBalanceItem,
  type StockBalanceStatus,
} from "@/features/stock/types/stock-balance";

type StockBalancePageProps = {
  stockId: string;
};

const DEFAULT_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type StatusFilter = "all" | StockBalanceStatus;

export function StockBalancePage({ stockId }: StockBalancePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockQuery = useStockQuery(stockId);

  const initialSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [drawerProduct, setDrawerProduct] = useState<StockBalanceItem | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const balanceQuery = useStockBalanceQuery({
    stockId,
    search: debouncedSearch,
    status: status === "all" ? undefined : status,
    page,
    perPage,
  });

  // Cards de resumo: contagens EXATAS vindas do `meta.total` de cada status.
  //
  // Antes eram contadas no cliente sobre uma página de 100, ao lado de um
  // "Produtos no estoque" que vinha do `meta.total` global — num depósito de
  // 400 SKUs os cards se contradiziam ("400 produtos / 12 sem saldo"). Como a
  // API já filtra por `status`, basta pedir `perPage=1` e ler o total: três
  // consultas baratas, sem trazer linha nenhuma a mais.
  const totalQuery = useStockBalanceQuery({
    stockId,
    search: debouncedSearch,
    page: 1,
    perPage: 1,
  });
  const lowQuery = useStockBalanceQuery({
    stockId,
    search: debouncedSearch,
    status: "low",
    page: 1,
    perPage: 1,
  });
  const emptyQuery = useStockBalanceQuery({
    stockId,
    search: debouncedSearch,
    status: "empty",
    page: 1,
    perPage: 1,
  });

  const summary = useMemo(
    () => ({
      total: totalQuery.data?.meta.total ?? 0,
      low: lowQuery.data?.meta.total ?? 0,
      empty: emptyQuery.data?.meta.total ?? 0,
    }),
    [totalQuery.data?.meta.total, lowQuery.data?.meta.total, emptyQuery.data?.meta.total],
  );

  useEffect(() => {
    if (stockQuery.isError) router.replace("/estoque");
  }, [stockQuery.isError, router]);

  if (stockQuery.isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Carregando estoque…
        </Typography>
      </Box>
    );
  }

  const stock = stockQuery.data;
  if (!stock) return null;

  const result = balanceQuery.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
  };

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 2 }}>
          <EntityFormHeader
            title={stock.name}
            subtitle="Balanço"
            backHref="/estoque"
          />

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <SummaryCard label="Produtos no estoque" value={summary.total} />
            <SummaryCard
              label="Saldo baixo"
              value={summary.low}
              tone="amber"
            />
            <SummaryCard label="Sem saldo" value={summary.empty} tone="rose" />
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" } }}
          >
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto…"
              sx={{ width: { xs: "100%", sm: 288 } }}
            />
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="balance-status-label">Situação</InputLabel>
              <Select
                labelId="balance-status-label"
                label="Situação"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <MenuItem value="all">Todas</MenuItem>
                {(
                  Object.keys(STOCK_BALANCE_STATUS_LABELS) as StockBalanceStatus[]
                ).map((key) => (
                  <MenuItem key={key} value={key}>
                    {STOCK_BALANCE_STATUS_LABELS[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {balanceQuery.isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar o balanço"
              onRetry={() => void balanceQuery.refetch()}
            />
          ) : (
            <StockBalanceTable
              items={result.data}
              isLoading={balanceQuery.isLoading}
              pageIndex={result.meta.page - 1}
              pageCount={result.meta.totalPages}
              totalRowCount={result.meta.total}
              pageSize={perPage}
              onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
              onPageSizeChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
              onViewMovements={(item) => setDrawerProduct(item)}
            />
          )}
        </Stack>
      </ScrollArea>

      <ProductMovementsDrawer
        open={drawerProduct != null}
        onOpenChange={(open) => {
          if (!open) setDrawerProduct(null);
        }}
        stockId={stockId}
        product={
          drawerProduct
            ? {
                id: drawerProduct.productId,
                name: drawerProduct.productName,
                sku: drawerProduct.productSku,
              }
            : null
        }
      />
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "amber" | "rose";
}) {
  const valueColor =
    tone === "amber"
      ? "warning.main"
      : tone === "rose"
        ? "error.main"
        : "text.primary";

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          mt: 0.5,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: valueColor,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
