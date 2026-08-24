"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput, Stack } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import {
  createEmptyUnitFormValues,
  formValuesToPayload,
  unitOfMeasureToFormValues,
} from "@/features/unit-of-measure/api/units-of-measure.service";
import { UnitOfMeasureFormDrawer } from "@/features/unit-of-measure/components/unit-of-measure-form-drawer";
import { UnitOfMeasureListTable } from "@/features/unit-of-measure/components/unit-of-measure-list-table";
import { useUnitOfMeasureList } from "@/features/unit-of-measure/hooks/use-unit-of-measure-list";
import {
  useCreateUnitOfMeasureMutation,
  useDeleteUnitOfMeasureMutation,
  useUpdateUnitOfMeasureMutation,
} from "@/features/unit-of-measure/hooks/use-unit-of-measure-mutations";
import type {
  UnitOfMeasure,
  UnitOfMeasureFormValues,
} from "@/features/unit-of-measure/types/unit-of-measure";

type DrawerState = {
  open: boolean;
  mode: "create" | "edit";
  unitId?: string;
  initialValues: UnitOfMeasureFormValues;
  formKey: string;
};

export function UnitOfMeasurePage() {
  const {
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refetch,
  } = useUnitOfMeasureList();

  const createMutation = useCreateUnitOfMeasureMutation();
  const updateMutation = useUpdateUnitOfMeasureMutation();
  const deleteMutation = useDeleteUnitOfMeasureMutation();

  const [drawer, setDrawer] = useState<DrawerState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyUnitFormValues(),
    formKey: "closed",
  }));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyUnitFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(unit: UnitOfMeasure) {
    setDrawer({
      open: true,
      mode: "edit",
      unitId: unit.id,
      initialValues: unitOfMeasureToFormValues(unit),
      formKey: `edit-${unit.id}-${Date.now()}`,
    });
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open && !isSaving) setDrawer((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: UnitOfMeasureFormValues) {
    if (!drawer.open) return;

    const payload = formValuesToPayload(values);
    if (!payload.name || !payload.abbreviation) return;

    if (drawer.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (drawer.unitId) {
      updateMutation.mutate(
        { id: drawer.unitId, payload },
        { onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })) },
      );
    }
  }

  function handleDelete(unit: UnitOfMeasure) {
    deleteMutation.mutate(unit.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Unidade de medida"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              value={search}
              size="small"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar unidades…"
              sx={{ width: { xs: 224, sm: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Nova unidade
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
            <AlertTitle>Não foi possível carregar as unidades</AlertTitle>
            {error instanceof Error ? error.message : "Erro inesperado"}
          </Alert>
        ) : (
          <UnitOfMeasureListTable
            units={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </ListPagePanel>

      <UnitOfMeasureFormDrawer
        open={drawer.open}
        onClose={() => handleDrawerOpenChange(false)}
        mode={drawer.mode}
        initialValues={drawer.initialValues}
        formKey={drawer.formKey}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </ListPageShell>
  );
}
