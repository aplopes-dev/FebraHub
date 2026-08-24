"use client";

import { useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { StockMovementDetailDrawer } from "@/features/stock-movements/components/stock-movement-detail-drawer";
import { StockMovementListTable } from "@/features/stock-movements/components/stock-movement-list-table";
import { StockMovementListTabs } from "@/features/stock-movements/components/stock-movement-list-tabs";
import { StockMovementListToolbar } from "@/features/stock-movements/components/stock-movement-list-toolbar";
import { useStockMovementList } from "@/features/stock-movements/hooks/use-stock-movement-list";
import type { StockMovementListItem } from "@/features/stock-movements/types/stock-movement";

export function StockMovementListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    reason,
    setReason,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading,
    isError,
    refetch,
  } = useStockMovementList();

  const [selectedMovement, setSelectedMovement] =
    useState<StockMovementListItem | null>(null);

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Movimentações"
        actions={
          <Button
            component={Link}
            href="/estoque/movimentacoes/novo"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nova movimentação
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <StockMovementListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ flexShrink: 0 }}>
            <StockMovementListToolbar
              search={search}
              onSearchChange={setSearch}
              reason={reason}
              onReasonChange={setReason}
            />
          </Box>
          {isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar as movimentações"
              onRetry={() => void refetch()}
            />
          ) : (
            <StockMovementListTable
              movements={result.data}
              pageIndex={result.meta.page - 1}
              pageCount={result.meta.totalPages}
              totalRowCount={result.meta.total}
              pageSize={perPage}
              onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
              onPageSizeChange={setPerPage}
              onView={setSelectedMovement}
              isLoading={isLoading}
            />
          )}
        </Stack>
      </ListPagePanel>

      <StockMovementDetailDrawer
        movement={selectedMovement}
        onOpenChange={(open) => {
          if (!open) setSelectedMovement(null);
        }}
      />
    </ListPageShell>
  );
}
