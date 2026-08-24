"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { Box, Button, PageHeader, Stack } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { FiscalParametersFiltersDrawer } from "@/features/fiscal-parameters/components/fiscal-parameters-filters-drawer";
import { FiscalParametersListTable } from "@/features/fiscal-parameters/components/fiscal-parameters-list-table";
import { FiscalParametersListTabs } from "@/features/fiscal-parameters/components/fiscal-parameters-list-tabs";
import { FiscalParametersListToolbar } from "@/features/fiscal-parameters/components/fiscal-parameters-list-toolbar";
import { useFiscalParametersList } from "@/features/fiscal-parameters/hooks/use-fiscal-parameters-list";

export function FiscalParametersListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    category,
    setCategory,
    categories,
    filters,
    setFilters,
    sort,
    setSort,
    setPage,
    perPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refetch,
  } = useFiscalParametersList();

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Parâmetros fiscais"
        actions={
          <Button
            type="button"
            variant="outlined"
            component={Link}
            href="/catalogo/produtos"
            startIcon={<Inventory2Outlined sx={{ fontSize: 16 }} />}
          >
            Gerenciar produtos
          </Button>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <FiscalParametersListTabs
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
            <FiscalParametersListToolbar
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              categories={categories}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

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
              <AlertTitle>Não foi possível carregar os parâmetros fiscais</AlertTitle>
              {error instanceof Error ? error.message : "Erro inesperado"}
            </Alert>
          ) : (
            <FiscalParametersListTable
              items={result.data}
              page={result.meta.page}
              total={result.meta.total}
              pageSize={perPage}
              isFetching={isFetching}
              onPageChange={setPage}
              onPageSizeChange={setPerPage}
            />
          )}
        </Box>

        <FiscalParametersFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          categories={categories}
          onApply={setFilters}
        />
      </ListPagePanel>
    </ListPageShell>
  );
}
