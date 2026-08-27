"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { ProductFiltersDrawer } from "@/features/products/components/product-filters-drawer";
import { ProductImportDrawer } from "@/features/products/components/product-import-drawer";
import { ProductListTable } from "@/features/products/components/product-list-table";
import { ProductListTabs } from "@/features/products/components/product-list-tabs";
import { ProductListToolbar } from "@/features/products/components/product-list-toolbar";
import { ProductSelectionBar } from "@/features/products/components/product-selection-bar";
import { useProductList } from "@/features/products/hooks/use-product-list";

export function ProductListPage() {
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
    clearSelection,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductList();

  const [importOpen, setImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Produtos"
        actions={
          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<CloudUploadOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setImportOpen(true)}
            >
              Importar
            </Button>
            <Button
              type="button"
              variant="contained"
              component={Link}
              href="/catalogo/produtos/novo"
              startIcon={<AddIcon fontSize="small" />}
            >
              Novo produto
            </Button>
          </Stack>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <ProductListTabs
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
            <ProductListToolbar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

          <ProductSelectionBar
            selectedIds={selectedIds}
            onClear={clearSelection}
          />

          {isError ? (
            <Alert
              severity="error"
              action={
                <Button
                  type="button"
                  color="inherit"
                  onClick={() => void refetch()}
                >
                  Tentar novamente
                </Button>
              }
            >
              <AlertTitle>Não foi possível carregar os produtos</AlertTitle>
              {error instanceof Error ? error.message : "Erro inesperado"}
            </Alert>
          ) : (
            <ProductListTable
              products={result.data}
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
              isLoading={isLoading}
            />
          )}
        </Box>

        <ProductImportDrawer open={importOpen} onOpenChange={setImportOpen} />
        <ProductFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
        />
      </ListPagePanel>
    </ListPageShell>
  );
}
