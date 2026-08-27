"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { VariationFormDrawer } from "@/features/variations/components/variation-form-drawer";
import { VariationListTable } from "@/features/variations/components/variation-list-table";
import { useVariationList } from "@/features/variations/hooks/use-variation-list";
import {
  useCreateVariationMutation,
  useDeleteVariationMutation,
  useUpdateVariationMutation,
} from "@/features/variations/hooks/use-variation-mutations";
import {
  createEmptyVariationFormValues,
  variationToFormValues,
} from "@/features/variations/api/variations.service";
import type {
  Variation,
  VariationFormValues,
} from "@/features/variations/types/variation";

type DrawerState = {
  open: boolean;
  mode: "create" | "edit";
  variationId?: string;
  initialValues: VariationFormValues;
  formKey: string;
};

export function VariationListPage() {
  const {
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
    isFetching,
    isError,
    error,
    refetch,
  } = useVariationList();

  const createMutation = useCreateVariationMutation();
  const updateMutation = useUpdateVariationMutation();
  const deleteMutation = useDeleteVariationMutation();

  const [drawer, setDrawer] = useState<DrawerState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyVariationFormValues(),
    formKey: "closed",
  }));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyVariationFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(variation: Variation) {
    setDrawer({
      open: true,
      mode: "edit",
      variationId: variation.id,
      initialValues: variationToFormValues(variation),
      formKey: `edit-${variation.id}-${Date.now()}`,
    });
  }

  function handleDrawerClose() {
    if (!isSaving) setDrawer((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: VariationFormValues) {
    if (!drawer.open) return;
    if (!values.name.trim()) return;

    if (drawer.mode === "create") {
      createMutation.mutate(values, {
        onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (drawer.variationId) {
      updateMutation.mutate(
        { id: drawer.variationId, values },
        { onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })) },
      );
    }
  }

  function handleDelete(variation: Variation) {
    deleteMutation.mutate(variation.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Variações"
        actions={
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
            }}
          >
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar variações…"
              sx={{ width: { xs: 180, sm: 280 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Nova variação
            </Button>
          </Stack>
        }
      />
      <ListPagePanel>
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
            <AlertTitle>Não foi possível carregar as variações</AlertTitle>
            {error instanceof Error ? error.message : "Erro inesperado"}
          </Alert>
        ) : (
          <VariationListTable
            variations={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            selectedIds={selectedIds}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onToggleSelectAllPage={toggleSelectAllPage}
            onToggleSelectOne={toggleSelectOne}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </ListPagePanel>
      <VariationFormDrawer
        open={drawer.open}
        onClose={handleDrawerClose}
        mode={drawer.mode}
        initialValues={drawer.initialValues}
        formKey={drawer.formKey}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </ListPageShell>
  );
}
