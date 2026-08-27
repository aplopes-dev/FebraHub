"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { TechnicalSheetFiltersDrawer } from "@/features/technical-sheets/components/technical-sheet-filters-drawer";
import { TechnicalSheetListTable } from "@/features/technical-sheets/components/technical-sheet-list-table";
import { TechnicalSheetListTabs } from "@/features/technical-sheets/components/technical-sheet-list-tabs";
import { TechnicalSheetListToolbar } from "@/features/technical-sheets/components/technical-sheet-list-toolbar";
import { useTechnicalSheetList } from "@/features/technical-sheets/hooks/use-technical-sheet-list";

export function TechnicalSheetListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    category,
    setCategory,
    filters,
    setFilters,
    sort,
    setSort,
    setPage,
    perPage,
    setPerPage,
    result,
    categories,
    isFetching,
    isError,
    error,
    refetch,
  } = useTechnicalSheetList();

  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Fichas técnicas"
        actions={
          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <Button
              type="button"
              variant="outlined"
              component={Link}
              href="/catalogo/produtos"
              startIcon={<Inventory2Outlined sx={{ fontSize: 16 }} />}
            >
              Gerenciar produtos
            </Button>
          </Stack>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <TechnicalSheetListTabs
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
            <TechnicalSheetListToolbar
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
              <AlertTitle>Não foi possível carregar as fichas técnicas</AlertTitle>
              {error instanceof Error ? error.message : "Erro inesperado"}
            </Alert>
          ) : (
            <TechnicalSheetListTable
              sheets={result.data}
              page={result.meta.page}
              total={result.meta.total}
              pageSize={perPage}
              isFetching={isFetching}
              onPageChange={setPage}
              onPageSizeChange={setPerPage}
            />
          )}
        </Box>

        <TechnicalSheetFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          categories={categories}
          onApply={setFilters}
        />
      </ListPagePanel>
    </Box>
  );
}
