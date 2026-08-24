"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { FinancialStatementEmptyState } from "@/features/financial-statement/components/financial-statement-empty-state";
import { FinancialStatementFiltersDrawer } from "@/features/financial-statement/components/financial-statement-filters-drawer";
import { FinancialStatementSelectionBar } from "@/features/financial-statement/components/financial-statement-selection-bar";
import { FinancialStatementSummaryCards } from "@/features/financial-statement/components/financial-statement-summary-cards";
import { FinancialStatementTable } from "@/features/financial-statement/components/financial-statement-table";
import { FinancialStatementToolbar } from "@/features/financial-statement/components/financial-statement-toolbar";
import { useFinancialStatementList } from "@/features/financial-statement/hooks/use-financial-statement-list";
import { useFinancialStatementSelection } from "@/features/financial-statement/hooks/use-financial-statement-selection";
import { useFinancialStatementSummary } from "@/features/financial-statement/hooks/use-financial-statement-summary";
import { countActiveFinancialStatementFilters } from "@/features/financial-statement/lib/financial-statement-filters";
import { createEmptyFinancialStatementFilters } from "@/features/financial-statement/lib/financial-statement-filters";

export function FinancialStatementPage() {
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
    refresh,
    summaryParams,
  } = useFinancialStatementList();
  const { summary } = useFinancialStatementSummary(summaryParams);
  const selection = useFinancialStatementSelection(
    result.data,
    filters,
    search,
    result.meta.page,
  );

  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = countActiveFinancialStatementFilters(filters);
  const hasResults = result.data.length > 0;

  function handleClearFilters() {
    setFilters(createEmptyFinancialStatementFilters());
    setSearch("");
  }

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
      <Box sx={{ flexShrink: 0 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ alignItems: { lg: "flex-start" }, justifyContent: "space-between", mb: 2 }}
        >
          <PageHeader
            sx={{ mb: 0, flex: 1, minWidth: 0 }}
            title="Extrato"
            description="Consulta somente-leitura das movimentações financeiras da organização."
          />
          <Stack spacing={1} sx={{ alignItems: { xs: "stretch", lg: "flex-end" } }}>
            <FinancialStatementSummaryCards
              receivable={summary.receivable}
              payable={summary.payable}
              net={summary.net}
            />
          </Stack>
        </Stack>

        <FinancialStatementToolbar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      </Box>

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
            title="Não foi possível carregar o extrato"
            message="Tente novamente em instantes."
            onRetry={refresh}
          />
        ) : !hasResults ? (
          <FinancialStatementEmptyState
            variant={activeFilterCount > 0 || search.trim() ? "no-match" : "no-data"}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <FinancialStatementTable
            entries={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            selectedIds={selection.selectedIds}
            onToggleSelect={selection.toggle}
          />
        )}
      </ListPagePanel>

      <FinancialStatementSelectionBar
        count={selection.totals.count}
        netCents={selection.totals.netCents}
        onClear={selection.clear}
      />

      <FinancialStatementFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
      />
    </Box>
  );
}
