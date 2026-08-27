"use client";

import Sort from "@mui/icons-material/Sort";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput, Stack } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { PriceListFormDrawer } from "@/features/price-lists/components/price-list-form-drawer";
import { PriceListListTable } from "@/features/price-lists/components/price-list-list-table";
import { PriceListPriorityDrawer } from "@/features/price-lists/components/price-list-priority-drawer";
import { priceListToFormValues } from "@/features/price-lists/api/price-list.mapper";
import { usePriceListList } from "@/features/price-lists/hooks/use-price-list-list";
import {
  useCreatePriceListMutation,
  useDeletePriceListMutation,
  useReorderPriceListsMutation,
  useUpdatePriceListMutation,
} from "@/features/price-lists/hooks/use-price-list-mutations";
import { usePriceListsByPriorityQuery } from "@/features/price-lists/hooks/use-price-list-queries";
import { createEmptyPriceListFormValues } from "@/features/price-lists/lib/price-list-form-values";
import type {
  PriceList,
  PriceListFormValues,
} from "@/features/price-lists/types/price-list";

type DrawerState = {
  open: boolean;
  mode: "create" | "edit";
  priceListId?: string;
  initialValues: PriceListFormValues;
  formKey: string;
};

export function PriceListListPage() {
  const {
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isLoading,
    isError,
    refetch,
  } = usePriceListList();

  const priorityQuery = usePriceListsByPriorityQuery();
  const createMutation = useCreatePriceListMutation();
  const updateMutation = useUpdatePriceListMutation();
  const deleteMutation = useDeletePriceListMutation();
  const reorderMutation = useReorderPriceListsMutation();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [drawer, setDrawer] = useState<DrawerState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyPriceListFormValues(),
    formKey: "closed",
  }));
  const [priorityOpen, setPriorityOpen] = useState(false);

  const prioritizedLists = useMemo(
    () => priorityQuery.data ?? [],
    [priorityQuery.data],
  );

  const priorityRankById = useMemo(() => {
    const map = new Map<string, number>();
    prioritizedLists.forEach((list, index) => map.set(list.id, index + 1));
    return map;
  }, [prioritizedLists]);

  function handleSavePriority(orderedIds: string[]) {
    reorderMutation.mutate(orderedIds, {
      onSuccess: () => setPriorityOpen(false),
    });
  }

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyPriceListFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(priceList: PriceList) {
    setDrawer({
      open: true,
      mode: "edit",
      priceListId: priceList.id,
      initialValues: priceListToFormValues(priceList),
      formKey: `edit-${priceList.id}-${Date.now()}`,
    });
  }

  function handleSave(values: PriceListFormValues) {
    if (!drawer.open) return;
    if (!values.name.trim()) return;

    if (drawer.mode === "create") {
      createMutation.mutate(values, {
        onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (drawer.priceListId) {
      updateMutation.mutate(
        { id: drawer.priceListId, values },
        {
          onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
        },
      );
    }
  }

  function handleDelete(priceList: PriceList) {
    return deleteMutation.mutateAsync(priceList.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Lista de preços"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              value={search}
              size="small"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar listas…"
              sx={{ width: { xs: 224, sm: 288 } }}
            />
            <Button
              type="button"
              variant="outlined"
              startIcon={<Sort sx={{ fontSize: 16 }} />}
              onClick={() => setPriorityOpen(true)}
            >
              Priorizar
            </Button>
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Nova lista de preços
            </Button>
          </Stack>
        }
      />

      {isError ? (
        <ListLoadErrorAlert
          title="Não foi possível carregar as listas de preços"
          onRetry={() => void refetch()}
        />
      ) : null}

      <ListPagePanel>
        <PriceListListTable
          priceLists={result.data}
          priorityRankById={priorityRankById}
          page={result.meta.page}
          total={result.meta.total}
          pageSize={perPage}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </ListPagePanel>

      <PriceListFormDrawer
        open={drawer.open}
        onClose={() => setDrawer((prev) => ({ ...prev, open: false }))}
        mode={drawer.mode}
        initialValues={drawer.initialValues}
        formKey={drawer.formKey}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <PriceListPriorityDrawer
        open={priorityOpen}
        onOpenChange={setPriorityOpen}
        priceLists={prioritizedLists}
        onSave={handleSavePriority}
        isSaving={reorderMutation.isPending}
      />
    </ListPageShell>
  );
}
