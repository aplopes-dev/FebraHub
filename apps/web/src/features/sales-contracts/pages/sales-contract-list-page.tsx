"use client";

import { useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { ContractStatusDrawer } from "@/features/sales-contracts/components/contract-status-drawer";
import { SalesContractFiltersDrawer } from "@/features/sales-contracts/components/sales-contract-filters-drawer";
import { SalesContractListTable } from "@/features/sales-contracts/components/sales-contract-list-table";
import { SalesContractListTabs } from "@/features/sales-contracts/components/sales-contract-list-tabs";
import { SalesContractListToolbar } from "@/features/sales-contracts/components/sales-contract-list-toolbar";
import { useSalesContractList } from "@/features/sales-contracts/hooks/use-sales-contract-list";

export function SalesContractListPage() {
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
    removeContract,
    restoreContract,
    refresh,
  } = useSalesContractList();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Contratos de venda"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<ChecklistOutlinedIcon fontSize="small" />}
              onClick={() => setStatusOpen(true)}
            >
              Status
            </Button>
            <Button
              type="button"
              variant="contained"
              component={Link}
              href="/vendas/contratos-de-vendas/novo"
              startIcon={<AddIcon fontSize="small" />}
            >
              Novo contrato
            </Button>
          </Stack>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <SalesContractListTabs
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
            <SalesContractListToolbar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

          <SalesContractListTable
            contracts={result.data}
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
            onDelete={removeContract}
            onRestore={restoreContract}
          />
        </Box>

        <SalesContractFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
        />

        <ContractStatusDrawer
          open={statusOpen}
          onOpenChange={setStatusOpen}
          onChanged={refresh}
        />
      </ListPagePanel>
    </ListPageShell>
  );
}
