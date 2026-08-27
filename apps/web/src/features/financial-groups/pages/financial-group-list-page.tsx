"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { toast, Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { FinancialGroupFormDialog } from "@/features/financial-groups/components/financial-group-form-dialog";
import { FinancialGroupListTable } from "@/features/financial-groups/components/financial-group-list-table";
import { FinancialGroupListTabs } from "@/features/financial-groups/components/financial-group-list-tabs";
import { FinancialGroupListToolbar } from "@/features/financial-groups/components/financial-group-list-toolbar";
import {
  createEmptyFinancialGroupFormValues,
  financialGroupToFormValues,
  toSaveFinancialGroupPayload,
} from "@/features/financial-groups/api/financial-group.mapper";
import { useFinancialGroupList } from "@/features/financial-groups/hooks/use-financial-group-list";
import {
  useCreateFinancialGroupMutation,
  useDeleteFinancialGroupMutation,
  useRestoreFinancialGroupMutation,
  useUpdateFinancialGroupMutation,
} from "@/features/financial-groups/hooks/use-financial-group-mutations";
import type {
  FinancialGroup,
  FinancialGroupFormValues,
} from "@/features/financial-groups/types/financial-group";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  groupId?: string;
  initialValues: FinancialGroupFormValues;
  formKey: string;
  typeLocked: boolean;
};

export function FinancialGroupListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    type,
    setType,
    setPage,
    perPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refresh,
  } = useFinancialGroupList();

  const createMutation = useCreateFinancialGroupMutation();
  const updateMutation = useUpdateFinancialGroupMutation();
  const deleteMutation = useDeleteFinancialGroupMutation();
  const restoreMutation = useRestoreFinancialGroupMutation();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyFinancialGroupFormValues(),
    formKey: "closed",
    typeLocked: false,
  }));

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyFinancialGroupFormValues(),
      formKey: `create-${Date.now()}`,
      typeLocked: false,
    });
  }

  function openEdit(group: FinancialGroup) {
    setDialog({
      open: true,
      mode: "edit",
      groupId: group.id,
      initialValues: financialGroupToFormValues(group),
      formKey: `edit-${group.id}-${Date.now()}`,
      typeLocked: group.isSystem,
    });
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && !isSaving) {
      setDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function handleSave(values: FinancialGroupFormValues) {
    if (!dialog.open) return;
    if (!values.name.trim()) {
      toast.error("Informe o nome do grupo financeiro.");
      return;
    }

    const payload = toSaveFinancialGroupPayload(values);

    if (dialog.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (dialog.groupId) {
      updateMutation.mutate(
        { id: dialog.groupId, payload },
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
        title="Grupo financeiro"
        actions={
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openCreate}
          >
            Novo grupo
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <FinancialGroupListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <FinancialGroupListToolbar
            search={search}
            onSearchChange={setSearch}
            type={type}
            onTypeChange={setType}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os grupos financeiros"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <FinancialGroupListTable
            groups={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={(group) => deleteMutation.mutateAsync(group.id)}
            onRestore={(group) => restoreMutation.mutateAsync(group.id)}
          />
        )}
      </ListPagePanel>

      <FinancialGroupFormDialog
        open={dialog.open}
        onOpenChange={handleDialogOpenChange}
        mode={dialog.mode}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        typeLocked={dialog.typeLocked}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </ListPageShell>
  );
}
