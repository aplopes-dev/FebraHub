"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { SaleOrderFiltersDrawer } from "@/features/sales-orders/components/sale-order-filters-drawer";
import { SaleOrderListTable } from "@/features/sales-orders/components/sale-order-list-table";
import { SaleOrderListTabs } from "@/features/sales-orders/components/sale-order-list-tabs";
import { SaleOrderListToolbar } from "@/features/sales-orders/components/sale-order-list-toolbar";
import { useSaleOrderList } from "@/features/sales-orders/hooks/use-sale-order-list";

export function SaleOrderListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    changeStatus,
    removeOrder,
  } = useSaleOrderList();

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Pedidos de venda"
        actions={
          <Button
            type="button"
            variant="contained"
            component={Link}
            href="/vendas/pedidos-de-venda/novo"
            startIcon={<AddIcon fontSize="small" />}
          >
            Novo pedido
          </Button>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <SaleOrderListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            gap: 2,
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <SaleOrderListToolbar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

          <SaleOrderListTable
            orders={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            selectedIds={selectedIds}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onToggleSelectAllPage={toggleSelectAllPage}
            onToggleSelectOne={toggleSelectOne}
            onChangeStatus={changeStatus}
            onDelete={removeOrder}
          />
        </Box>

        <SaleOrderFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
        />
      </ListPagePanel>
    </ListPageShell>
  );
}
