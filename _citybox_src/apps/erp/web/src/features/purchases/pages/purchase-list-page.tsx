"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { useActiveSuppliersQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import { PurchaseFiltersDrawer } from "@/features/purchases/components/purchase-filters-drawer";
import { PurchaseListTable } from "@/features/purchases/components/purchase-list-table";
import { PurchaseListTabs } from "@/features/purchases/components/purchase-list-tabs";
import { PurchaseListToolbar } from "@/features/purchases/components/purchase-list-toolbar";
import { usePurchaseList } from "@/features/purchases/hooks/use-purchase-list";
import type { SupplierOption } from "@/features/purchases/types/purchase";

export function PurchaseListPage() {
  const {
    tab,
    setTab,
    status,
    setStatus,
    search,
    setSearch,
    filters,
    setFilters,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    remove,
    restore,
    isDeleting,
    isRestoring,
    isLoading,
    isError,
    refresh,
  } = usePurchaseList();

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

  const suppliersQuery = useActiveSuppliersQuery();
  const suppliers = useMemo<SupplierOption[]>(
    () =>
      (suppliersQuery.data ?? []).map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
      })),
    [suppliersQuery.data],
  );

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Compras"
        actions={
          <Button
            component={Link}
            href="/estoque/compras/novo"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nova compra
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <PurchaseListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ flexShrink: 0 }}>
            <PurchaseListToolbar
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              filters={filters}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>
          {isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar as compras"
              onRetry={() => void refresh()}
            />
          ) : (
          <PurchaseListTable
            purchases={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            selectedIds={selectedIds}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onToggleSelectAllPage={toggleSelectAllPage}
            onToggleSelectOne={toggleSelectOne}
            onDelete={remove}
            onRestore={restore}
            isDeleting={isDeleting}
            isRestoring={isRestoring}
            isLoading={isLoading}
          />
          )}
        </Stack>
      </ListPagePanel>

      <PurchaseFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        warehouses={warehouses}
        suppliers={suppliers}
        onApply={setFilters}
      />
    </ListPageShell>
  );
}
