"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { CustomerJourneyDrawer } from "@/features/customers/components/customer-journey-drawer";
import { CustomerListTable } from "@/features/customers/components/customer-list-table";
import { CustomerListTabs } from "@/features/customers/components/customer-list-tabs";
import { CustomerListToolbar } from "@/features/customers/components/customer-list-toolbar";
import { useCustomerList } from "@/features/customers/hooks/use-customer-list";
import type { Customer } from "@/features/customers/types/customer";

export function CustomerListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    isError,
    error,
    refresh,
  } = useCustomerList();
  const [journeyOf, setJourneyOf] = useState<Customer | null>(null);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Clientes"
        actions={
          <Button
            type="button"
            variant="contained"
            component={Link}
            href="/clientes/novo"
            startIcon={<AddIcon fontSize="small" />}
          >
            Novo cliente
          </Button>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <CustomerListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <Box sx={{ p: 2 }}>
            <ListLoadErrorAlert
              title="Não foi possível carregar os clientes"
              message={
                error instanceof Error ? error.message : "Erro inesperado"
              }
              onRetry={() => void refresh()}
            />
          </Box>
        ) : (
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
              <CustomerListToolbar search={search} onSearchChange={setSearch} />
            </Box>

            <CustomerListTable
              customers={result.data}
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
              onRowClick={setJourneyOf}
            />
          </Box>
        )}
      </ListPagePanel>

      <CustomerJourneyDrawer
        customer={journeyOf}
        onClose={() => setJourneyOf(null)}
      />
    </ListPageShell>
  );
}
