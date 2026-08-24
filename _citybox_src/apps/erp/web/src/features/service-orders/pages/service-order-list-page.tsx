"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, PageHeader, toast } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { ServiceOrderFiltersDrawer } from "@/features/service-orders/components/service-order-filters-drawer";
import { ServiceOrderListTable } from "@/features/service-orders/components/service-order-list-table";
import { ServiceOrderListTabs } from "@/features/service-orders/components/service-order-list-tabs";
import { ServiceOrderListToolbar } from "@/features/service-orders/components/service-order-list-toolbar";
import { ServiceOrderPaymentDialog } from "@/features/service-orders/components/service-order-payment-dialog";
import { ServiceOrderStatusDrawer } from "@/features/service-orders/components/service-order-status-drawer";
import { useServiceOrderList } from "@/features/service-orders/hooks/use-service-order-list";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";

export function ServiceOrderListPage() {
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
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    cancelOne,
    refresh,
  } = useServiceOrderList();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const [saleTarget, setSaleTarget] = useState<ServiceOrder | null>(null);

  function handleEdit(order: ServiceOrder) {
    router.push(`/vendas/ordem-de-servicos/${order.id}`);
  }

  function handleCancel(order: ServiceOrder) {
    cancelOne(order.id);
    toast.success(`${order.code} cancelada.`);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Ordens de serviço"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<SettingsOutlinedIcon fontSize="small" />}
              onClick={() => setStatusManagerOpen(true)}
            >
              Gerenciar status
            </Button>
            <Button
              type="button"
              variant="contained"
              component={Link}
              href="/vendas/ordem-de-servicos/novo"
              startIcon={<AddIcon fontSize="small" />}
            >
              Nova OS
            </Button>
          </Stack>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <ServiceOrderListTabs
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
            <ServiceOrderListToolbar
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              sort={sort}
              onSortChange={setSort}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Box>

          <ServiceOrderListTable
            orders={result.data}
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
            onEdit={handleEdit}
            onGenerateSale={setSaleTarget}
            onCancel={handleCancel}
          />
        </Box>

        <ServiceOrderFiltersDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          value={filters}
          onApply={setFilters}
        />

        <ServiceOrderStatusDrawer
          open={statusManagerOpen}
          onOpenChange={setStatusManagerOpen}
          onChanged={refresh}
        />

        <ServiceOrderPaymentDialog
          order={saleTarget}
          onOpenChange={(open) => {
            if (!open) setSaleTarget(null);
          }}
          onCompleted={refresh}
        />
      </ListPagePanel>
    </ListPageShell>
  );
}
