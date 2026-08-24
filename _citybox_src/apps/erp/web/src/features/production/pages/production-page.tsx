"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, PageHeader, SearchInput, Tab, Tabs } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { ProductionFinalizeDialog } from "@/features/production/components/production-finalize-dialog";
import { ProductionOrderCreateDrawer } from "@/features/production/components/production-order-create-drawer";
import { ProductionKanban } from "@/features/production/components/production-kanban";
import { ProductionKanbanSkeleton } from "@/features/production/components/production-kanban-skeleton";
import { ProductionOrderDrawer } from "@/features/production/components/production-order-drawer";
import { ProductionOrderListTable } from "@/features/production/components/production-order-list-table";
import { ProductionViewToggle } from "@/features/production/components/production-view-toggle";
import {
  useProductionBoard,
  type ProductionStatusTab,
  type ProductionView,
} from "@/features/production/hooks/use-production-board";
import {
  useCancelProductionOrderMutation,
  useFinalizeProductionOrderMutation,
  useStartProductionOrderMutation,
} from "@/features/production/hooks/use-production-mutations";
import {
  PRODUCTION_STATUS_LABELS,
  type ProductionOrder,
} from "@/features/production/types/production";

type ProductionPageProps = {
  initialCreateOpen?: boolean;
};

const STATUS_TABS: ProductionStatusTab[] = [
  "all",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

const STATUS_TAB_LABELS: Record<ProductionStatusTab, string> = {
  all: "Todos",
  ...PRODUCTION_STATUS_LABELS,
};

export function ProductionPage({
  initialCreateOpen = false,
}: ProductionPageProps) {
  const {
    view,
    setView,
    statusTab,
    setStatusTab,
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    kanbanOrders,
    kanbanUpdatedAt,
    listOrders,
    listMeta,
    isKanbanLoading,
    isListLoading,
    isError,
    refresh,
    selectedOrder,
    setSelectedOrder,
    createOpen,
    setCreateOpen,
  } = useProductionBoard({ initialCreateOpen });

  const [finalizeRequest, setFinalizeRequest] = useState<{
    order: ProductionOrder;
    quantity: number;
  } | null>(null);

  const startMutation = useStartProductionOrderMutation();
  const cancelMutation = useCancelProductionOrderMutation();
  const finalizeMutation = useFinalizeProductionOrderMutation();

  function handleStart(order: ProductionOrder) {
    startMutation.mutate(order.id, {
      onSuccess: () => setSelectedOrder(null),
    });
  }

  function handleRequestFinalize(order: ProductionOrder, quantity: number) {
    setSelectedOrder(null);
    setFinalizeRequest({ order, quantity });
  }

  function handleConfirmFinalize(
    order: ProductionOrder,
    producedQuantity: number,
    observation?: string,
  ) {
    finalizeMutation.mutate(
      { id: order.id, producedQuantity, observation },
      { onSuccess: () => setFinalizeRequest(null) },
    );
  }

  function handleCancel(order: ProductionOrder) {
    cancelMutation.mutate(order.id, {
      onSuccess: () => setSelectedOrder(null),
    });
  }

  function handleViewChange(next: ProductionView) {
    setView(next);
  }

  return (
    <ListPageShell>
      <Box
        sx={{
          display: "grid",
          flexShrink: 0,
          alignItems: "start",
          columnGap: { xs: 2, md: 3 },
          rowGap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) auto minmax(0, 1fr)",
          },
        }}
      >
        <PageHeader
          sx={{ flexShrink: 0, mb: 0, minWidth: 0 }}
          title="Produção"
          description="Acompanhe pedidos, separe insumos e finalize a fabricação em um só lugar."
        />

        <Box
          sx={{
            justifySelf: { xs: "start", md: "center" },
            alignSelf: "center",
          }}
        >
          <ProductionViewToggle value={view} onChange={handleViewChange} />
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifySelf: { xs: "start", md: "end" },
            alignSelf: "center",
            flexWrap: "wrap",
          }}
        >
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por produto ou SKU…"
            sx={{ width: { xs: 224, sm: 288 } }}
          />
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setCreateOpen(true)}
          >
            Novo pedido
          </Button>
        </Stack>
      </Box>

      <ListPagePanel>
        {view === "list" ? (
          <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={statusTab}
              onChange={(_, next: ProductionStatusTab) => setStatusTab(next)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 44,
                "& .MuiTabs-indicator": { height: 2 },
              }}
            >
              {STATUS_TABS.map((tab) => (
                <Tab
                  key={tab}
                  value={tab}
                  label={STATUS_TAB_LABELS[tab]}
                  sx={{
                    minHeight: 44,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Tabs>
          </Box>
        ) : null}

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os pedidos de produção"
            onRetry={() => refresh()}
          />
        ) : view === "kanban" ? (
          isKanbanLoading ? (
            <ProductionKanbanSkeleton />
          ) : (
            <ProductionKanban
              key={`${kanbanUpdatedAt}:${search}`}
              orders={kanbanOrders}
              onStart={handleStart}
              onCardClick={(order) => setSelectedOrder(order)}
              onRequestFinalize={(order) =>
                handleRequestFinalize(order, order.plannedQuantity)
              }
            />
          )
        ) : (
          <ProductionOrderListTable
            orders={listOrders}
            onRowClick={(order) => setSelectedOrder(order)}
            onStart={handleStart}
            emptyMessage="Nenhum pedido de produção encontrado."
            pageIndex={listMeta.page - 1}
            totalRowCount={listMeta.total}
            pageSize={perPage}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            isLoading={isListLoading}
          />
        )}
      </ListPagePanel>

      <ProductionOrderDrawer
        order={selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
        onStart={handleStart}
        onRequestFinalize={handleRequestFinalize}
        onCancel={handleCancel}
      />

      <ProductionFinalizeDialog
        request={finalizeRequest}
        isSubmitting={finalizeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setFinalizeRequest(null);
        }}
        onConfirm={handleConfirmFinalize}
      />

      <ProductionOrderCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {}}
      />
    </ListPageShell>
  );
}
