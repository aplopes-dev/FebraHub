"use client";

import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { FinancialEntryFiltersDrawer } from "@/features/financial-entries/components/financial-entry-filters-drawer";
import { FinancialEntryListTable } from "@/features/financial-entries/components/financial-entry-list-table";
import { FinancialEntryListTabs } from "@/features/financial-entries/components/financial-entry-list-tabs";
import { FinancialEntryListToolbar } from "@/features/financial-entries/components/financial-entry-list-toolbar";
import { TransferDialog } from "@/features/financial-entries/components/transfer-dialog";
import { useFinancialEntryList } from "@/features/financial-entries/hooks/use-financial-entry-list";
import type { FinancialEntry } from "@/features/financial-entries/types/financial-entry";

export function FinancialEntryListPage() {
  const router = useRouter();
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
    isError,
    removeOne,
    isRemoving,
    restoreOne,
    isRestoring,
    refresh,
  } = useFinancialEntryList();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // `removeOne`/`restoreOne` já disparam o toast de sucesso/erro na própria
  // mutation — aqui só repassamos a Promise para os controles mostrarem loading.
  async function handleDelete(entry: FinancialEntry) {
    await removeOne(entry.id);
  }

  async function handleRestore(entry: FinancialEntry) {
    await restoreOne(entry.id);
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
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Lançamentos"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<SwapHorizOutlined sx={{ fontSize: 16 }} />}
              onClick={() => setTransferOpen(true)}
            >
              Transferências
            </Button>
            <Button
              type="button"
              variant="contained"
              component={Link}
              href="/financas/lancamentos/novo"
              startIcon={<AddIcon fontSize="small" />}
            >
              Novo lançamento
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <FinancialEntryListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <FinancialEntryListToolbar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            sort={sort}
            onSortChange={setSort}
            onOpenFilters={() => setFiltersOpen(true)}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os lançamentos"
            message="Tente novamente em instantes."
            onRetry={refresh}
          />
        ) : (
          <FinancialEntryListTable
            entries={result.data}
            tab={tab}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={(entry) =>
              router.push(`/financas/lancamentos/${entry.id}`)
            }
            onDelete={handleDelete}
            isDeleting={isRemoving}
            onRestore={handleRestore}
            isRestoring={isRestoring}
          />
        )}
      </ListPagePanel>

      <FinancialEntryFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onApply={setFilters}
      />

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} />
    </Box>
  );
}
