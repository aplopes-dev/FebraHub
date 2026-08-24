"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { StockTransferFiltersDrawer } from "@/features/stock-transfers/components/stock-transfer-filters-drawer";
import { StockTransferListTable } from "@/features/stock-transfers/components/stock-transfer-list-table";
import { StockTransferListTabs } from "@/features/stock-transfers/components/stock-transfer-list-tabs";
import { StockTransferListToolbar } from "@/features/stock-transfers/components/stock-transfer-list-toolbar";
import { useStockTransferList } from "@/features/stock-transfers/hooks/use-stock-transfer-list";

export function StockTransferListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    filters,
    setFilters,
    setPage,
    perPage,
    setPerPage,
    result,
    cancel,
    isCancelling,
    isLoading,
    isError,
    refresh,
  } = useStockTransferList();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const stocksQuery = useAllStocksQuery();

  const warehouses = useMemo(
    () =>
      (stocksQuery.data ?? []).map((stock) => ({
        id: stock.id,
        name: stock.name,
      })),
    [stocksQuery.data],
  );

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Transferências"
        actions={
          <Button
            component={Link}
            href="/estoque/transferencias/novo"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nova transferência
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <StockTransferListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <StockTransferListToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onOpenFilters={() => setFiltersOpen(true)}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar as transferências"
            onRetry={() => void refresh()}
          />
        ) : (
          <StockTransferListTable
            transfers={result.data}
            pageIndex={result.meta.page - 1}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onCancel={cancel}
            isCancelling={isCancelling}
            isLoading={isLoading}
          />
        )}
      </ListPagePanel>

      <StockTransferFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        warehouses={warehouses}
        onApply={setFilters}
      />
    </ListPageShell>
  );
}
