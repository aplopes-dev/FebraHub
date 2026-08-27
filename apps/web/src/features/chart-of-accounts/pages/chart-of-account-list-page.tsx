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
import { ChartOfAccountFormDialog } from "@/features/chart-of-accounts/components/chart-of-account-form-dialog";
import { ChartOfAccountListTable } from "@/features/chart-of-accounts/components/chart-of-account-list-table";
import { ChartOfAccountListTabs } from "@/features/chart-of-accounts/components/chart-of-account-list-tabs";
import {
  chartOfAccountToFormValues,
  createEmptyChartOfAccountFormValues,
  toSaveChartOfAccountPayload,
} from "@/features/chart-of-accounts/api/chart-of-account.mapper";
import { useChartOfAccountList } from "@/features/chart-of-accounts/hooks/use-chart-of-account-list";
import {
  useCreateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useRestoreChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
} from "@/features/chart-of-accounts/hooks/use-chart-of-account-mutations";
import type {
  ChartOfAccount,
  ChartOfAccountFormValues,
} from "@/features/chart-of-accounts/types/chart-of-account";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  accountId?: string;
  initialValues: ChartOfAccountFormValues;
  formKey: string;
};

export function ChartOfAccountListPage() {
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
  } = useChartOfAccountList();

  const createMutation = useCreateChartOfAccountMutation();
  const updateMutation = useUpdateChartOfAccountMutation();
  const deleteMutation = useDeleteChartOfAccountMutation();
  const restoreMutation = useRestoreChartOfAccountMutation();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyChartOfAccountFormValues(),
    formKey: "closed",
  }));

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyChartOfAccountFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(account: ChartOfAccount) {
    setDialog({
      open: true,
      mode: "edit",
      accountId: account.id,
      initialValues: chartOfAccountToFormValues(account),
      formKey: `edit-${account.id}-${Date.now()}`,
    });
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open && !isSaving) {
      setDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function handleSave(values: ChartOfAccountFormValues) {
    if (!dialog.open) return;
    if (values.name.trim().length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    if (!values.financialGroupId) {
      toast.error("Selecione o grupo financeiro.");
      return;
    }

    const payload = toSaveChartOfAccountPayload(values);

    if (dialog.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (dialog.accountId) {
      updateMutation.mutate(
        { id: dialog.accountId, payload },
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
        title="Plano de contas"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar planos de contas…"
              sx={{ width: { xs: "100%", sm: 224, md: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Novo plano de contas
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <ChartOfAccountListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar o plano de contas"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <ChartOfAccountListTable
            accounts={result.data}
            pageIndex={result.meta.page - 1}
            pageCount={result.meta.totalPages}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={(account) => deleteMutation.mutateAsync(account.id)}
            onRestore={(account) => restoreMutation.mutateAsync(account.id)}
          />
        )}
      </ListPagePanel>

      <ChartOfAccountFormDialog
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
