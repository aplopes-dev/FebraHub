"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  PageHeader,
  SearchInput,
  Select,
} from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageScroll } from "@/components/ui/list-page";
import { VehicleModelCardGrid } from "@/features/vehicle-models/components/vehicle-model-card-grid";
import { VehicleModelFormDrawer } from "@/features/vehicle-models/components/vehicle-model-form-drawer";
import { VehicleModelListTable } from "@/features/vehicle-models/components/vehicle-model-list-table";
import { VehicleModelViewToggle } from "@/features/vehicle-models/components/vehicle-model-view-toggle";
import {
  createEmptyVehicleModelFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  vehicleModelToFormValues,
} from "@/features/vehicle-models/api/vehicle-model.mapper";
import {
  useChangeVehicleModelStatusMutation,
  useCreateVehicleModelMutation,
  useUpdateVehicleModelMutation,
} from "@/features/vehicle-models/hooks/use-vehicle-model-mutations";
import {
  toVehicleModelRow,
  useVehicleModelList,
  type VehicleModelRow,
} from "@/features/vehicle-models/hooks/use-vehicle-model-list";
import { VEHICLE_STATUS_FILTER_OPTIONS } from "@/features/vehicle-models/lib/vehicle-model-labels";
import {
  readStoredVehicleModelView,
  writeStoredVehicleModelView,
  type VehicleModelView,
} from "@/features/vehicle-models/lib/vehicle-model-view-storage";
import type {
  VehicleModelFormValues,
  VehicleModelStatusFilter,
} from "@/features/vehicle-models/types/vehicle-model";

type DrawerState = {
  open: boolean;
  mode: "create" | "edit";
  modelId?: string;
  initialValues: VehicleModelFormValues;
  formKey: string;
};

export function VehicleModelListPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    items,
    isFetching,
    isError,
    error,
    refetch,
  } = useVehicleModelList();

  const createMutation = useCreateVehicleModelMutation();
  const updateMutation = useUpdateVehicleModelMutation();
  const statusMutation = useChangeVehicleModelStatusMutation();

  const [view, setView] = useState<VehicleModelView>("grid");
  const [drawer, setDrawer] = useState<DrawerState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyVehicleModelFormValues(),
    formKey: "closed",
  }));

  useEffect(() => {
    setView(readStoredVehicleModelView("grid"));
  }, []);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const rows = useMemo(() => items.map(toVehicleModelRow), [items]);

  function handleViewChange(next: VehicleModelView) {
    setView(next);
    writeStoredVehicleModelView(next);
  }

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyVehicleModelFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(row: VehicleModelRow) {
    setDrawer({
      open: true,
      mode: "edit",
      modelId: row.id,
      initialValues: vehicleModelToFormValues(row),
      formKey: `edit-${row.id}-${Date.now()}`,
    });
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open && !isSaving) setDrawer((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: VehicleModelFormValues) {
    if (!drawer.open) return;

    if (!values.brand.trim() || !values.model.trim()) {
      return;
    }

    if (drawer.mode === "create") {
      createMutation.mutate(formValuesToCreatePayload(values), {
        onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (drawer.modelId) {
      updateMutation.mutate(
        {
          id: drawer.modelId,
          payload: formValuesToUpdatePayload(values),
        },
        { onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })) },
      );
    }
  }

  function handleActivate(row: VehicleModelRow) {
    statusMutation.mutate({ id: row.id, status: "ACTIVE" });
  }

  function handleDeactivate(row: VehicleModelRow) {
    statusMutation.mutate({ id: row.id, status: "INACTIVE" });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ListPageScroll>
        <Stack spacing={2}>
          <PageHeader
            sx={{ flexShrink: 0, mb: 0 }}
            title="Modelos de veículo"
            description="Catálogo de marca, modelo, versão, ano e tipo."
            actions={
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <VehicleModelViewToggle value={view} onChange={handleViewChange} />
                <SearchInput
                  value={search}
                  size="small"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar modelos…"
                  sx={{ width: { xs: 200, sm: 240 } }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="vehicle-model-status-filter-label">
                    Status
                  </InputLabel>
                  <Select
                    labelId="vehicle-model-status-filter-label"
                    id="vehicle-model-status-filter"
                    label="Status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as VehicleModelStatusFilter)
                    }
                  >
                    {VEHICLE_STATUS_FILTER_OPTIONS.map((option) => (
                      <MenuItem key={option.value || "all"} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="contained"
                  onClick={openCreate}
                  startIcon={<AddIcon />}
                >
                  Novo modelo
                </Button>
              </Stack>
            }
          />

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
              <AlertTitle>Não foi possível carregar os modelos</AlertTitle>
              {error instanceof Error ? error.message : "Erro inesperado"}
            </Alert>
          ) : view === "grid" ? (
            <VehicleModelCardGrid
              rows={rows}
              isFetching={isFetching}
              onEdit={openEdit}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
            />
          ) : (
            <ListPagePanel sx={{ flex: "none" }}>
              <VehicleModelListTable
                rows={rows}
                isFetching={isFetching}
                pageScroll
                onEdit={openEdit}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            </ListPagePanel>
          )}
        </Stack>
      </ListPageScroll>

      <VehicleModelFormDrawer
        open={drawer.open}
        onClose={() => handleDrawerOpenChange(false)}
        mode={drawer.mode}
        initialValues={drawer.initialValues}
        formKey={drawer.formKey}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </Box>
  );
}
