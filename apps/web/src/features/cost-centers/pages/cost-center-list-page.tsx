"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { toast, Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { CostCenterFormDialog } from "@/features/cost-centers/components/cost-center-form-dialog";
import { CostCenterListTable } from "@/features/cost-centers/components/cost-center-list-table";
import { CostCenterListTabs } from "@/features/cost-centers/components/cost-center-list-tabs";
import {
  createEmptyCostCenterFormValues,
  costCenterToFormValues,
  toSaveCostCenterPayload,
} from "@/features/cost-centers/api/cost-center.mapper";
import { useCostCenterList } from "@/features/cost-centers/hooks/use-cost-center-list";
import {
  useCreateCostCenterMutation,
  useDeleteCostCenterMutation,
  useRestoreCostCenterMutation,
  useUpdateCostCenterMutation,
} from "@/features/cost-centers/hooks/use-cost-center-mutations";
import type {
  CostCenter,
  CostCenterFormValues,
} from "@/features/cost-centers/types/cost-center";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  costCenterId?: string;
  initialValues: CostCenterFormValues;
  formKey: string;
};

export function CostCenterListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refresh,
  } = useCostCenterList();

  const createMutation = useCreateCostCenterMutation();
  const updateMutation = useUpdateCostCenterMutation();
  const deleteMutation = useDeleteCostCenterMutation();
  const restoreMutation = useRestoreCostCenterMutation();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyCostCenterFormValues(),
    formKey: "closed",
  }));

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyCostCenterFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(costCenter: CostCenter) {
    setDialog({
      open: true,
      mode: "edit",
      costCenterId: costCenter.id,
      initialValues: costCenterToFormValues(costCenter),
      formKey: `edit-${costCenter.id}-${Date.now()}`,
    });
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && !isSaving) {
      setDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function handleSave(values: CostCenterFormValues) {
    if (!dialog.open) return;
    if (!values.name.trim()) {
      toast.error("Informe o nome do centro de custo.");
      return;
    }

    const payload = toSaveCostCenterPayload(values);

    if (dialog.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (dialog.costCenterId) {
      updateMutation.mutate(
        { id: dialog.costCenterId, payload },
        {
          onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
        },
      );
    }
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Centro de custo"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar centros de custo…"
              sx={{ width: { xs: "100%", sm: 224, md: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Novo centro de custo
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <CostCenterListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os centros de custo"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <CostCenterListTable
            costCenters={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={(costCenter) =>
              deleteMutation.mutateAsync(costCenter.id)
            }
            onRestore={(costCenter) =>
              restoreMutation.mutateAsync(costCenter.id)
            }
          />
        )}
      </ListPagePanel>

      <CostCenterFormDialog
        open={dialog.open}
        onOpenChange={handleDialogOpenChange}
        mode={dialog.mode}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </ListPageShell>
  );
}
