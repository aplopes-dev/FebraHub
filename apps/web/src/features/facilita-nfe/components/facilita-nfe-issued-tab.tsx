"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { FacilitaNfeFiltersDrawer } from "@/features/facilita-nfe/components/facilita-nfe-filters-drawer";
import { FacilitaNfeIssuedTable } from "@/features/facilita-nfe/components/facilita-nfe-issued-table";
import { FacilitaNfeSummaryCards } from "@/features/facilita-nfe/components/facilita-nfe-summary-cards";
import { FacilitaNfeToolbar } from "@/features/facilita-nfe/components/facilita-nfe-toolbar";
import { useFacilitaNfeList } from "@/features/facilita-nfe/hooks/use-facilita-nfe-list";
import { useFacilitaNfeSummary } from "@/features/facilita-nfe/hooks/use-facilita-nfe-summary";

/**
 * Aba "Emitido" (US1) — única com dado real nesta entrega. Busca/filtro/
 * paginação 100% backend-driven (Constitution Princípio II, FR-002/FR-005).
 */
export function FacilitaNfeIssuedTab() {
  const {
    search,
    setSearch,
    filters,
    setFilters,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading,
    isError,
    isCompanyMissing,
    refresh,
    summaryParams,
  } = useFacilitaNfeList();
  const { summary } = useFacilitaNfeSummary(summaryParams);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasResults = result.data.length > 0;

  if (isCompanyMissing) {
    return (
      <EmptyState
        title="Emitente fiscal não configurado"
        description="Esta loja ainda não tem um Emitente fiscal cadastrado na fiscal-api para o CNPJ da organização. Configure o Emitente fiscal antes de consultar documentos emitidos."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ alignItems: { lg: "flex-start" }, justifyContent: "space-between" }}
      >
        <div />
        <FacilitaNfeSummaryCards summary={summary} />
      </Stack>

      <FacilitaNfeToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <ListPagePanel>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os documentos emitidos"
            message="Tente novamente em instantes."
            onRetry={refresh}
          />
        ) : !hasResults ? (
          <FacilitaNfeIssuedTable
            documents={[]}
            page={result.meta.page}
            total={0}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
          />
        ) : (
          <FacilitaNfeIssuedTable
            documents={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
          />
        )}
      </ListPagePanel>

      <FacilitaNfeFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
      />
    </Stack>
  );
}
