"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { SaleOrderFiltersDrawer } from "@/features/sales-orders/components/sale-order-filters-drawer";
import { SaleListTable } from "@/features/sales/components/sale-list-table";
import { SaleListToolbar } from "@/features/sales/components/sale-list-toolbar";
import { useSaleList } from "@/features/sales/hooks/use-sale-list";

export function SaleListPage() {
  const {
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
    removeOne,
  } = useSaleList();

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Vendas"
        actions={
          <Button
            type="button"
            variant="contained"
            component={Link}
            href="/vendas/novo"
            startIcon={<AddIcon fontSize="small" />}
          >
            Nova venda
          </Button>
        }
      />
      <ListPagePanel>
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
            <SaleListToolbar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

          <SaleListTable
            sales={result.data}
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
            onDelete={removeOne}
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
