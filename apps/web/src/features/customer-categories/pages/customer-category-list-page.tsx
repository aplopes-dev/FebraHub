"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { CustomerCategoryFormDialog } from "@/features/customer-categories/components/customer-category-form-dialog";
import { CustomerCategoryListTable } from "@/features/customer-categories/components/customer-category-list-table";
import { useCustomerCategoryList } from "@/features/customer-categories/hooks/use-customer-category-list";
import {
  useCreateCustomerCategoryMutation,
  useDeleteCustomerCategoryMutation,
  useUpdateCustomerCategoryMutation,
} from "@/features/customer-categories/hooks/use-customer-category-mutations";
import {
  createEmptyCustomerCategoryFormValues,
  customerCategoryToFormValues,
} from "@/features/customer-categories/services/customer-category.service";
import type {
  CustomerCategory,
  CustomerCategoryFormValues,
} from "@/features/customer-categories/types/customer-category";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  categoryId?: string;
  initialValues: CustomerCategoryFormValues;
  formKey: string;
};

export function CustomerCategoryListPage() {
  const {
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
    isError,
    error,
    refresh,
  } = useCustomerCategoryList();

  const createMutation = useCreateCustomerCategoryMutation();
  const updateMutation = useUpdateCustomerCategoryMutation();
  const deleteMutation = useDeleteCustomerCategoryMutation();

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyCustomerCategoryFormValues(),
    formKey: "closed",
  }));

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyCustomerCategoryFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(category: CustomerCategory) {
    setDialog({
      open: true,
      mode: "edit",
      categoryId: category.id,
      initialValues: customerCategoryToFormValues(category),
      formKey: `edit-${category.id}-${Date.now()}`,
    });
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function handleSave(values: CustomerCategoryFormValues) {
    if (!dialog.open) return;

    if (!values.name.trim()) {
      return;
    }

    const payload = {
      name: values.name.trim(),
      discountPercentage: values.discountPercentage,
    };

    if (dialog.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (dialog.categoryId) {
      updateMutation.mutate(
        { id: dialog.categoryId, payload },
        {
          onSuccess: () => setDialog((prev) => ({ ...prev, open: false })),
        },
      );
    }
  }

  function handleDelete(category: CustomerCategory) {
    deleteMutation.mutate(category.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Categoria de clientes"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categorias…"
              sx={{ width: { xs: "100%", sm: 224, md: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Nova categoria
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        {isError ? (
          <Box sx={{ p: 2 }}>
            <ListLoadErrorAlert
              title="Não foi possível carregar as categorias"
              message={
                error instanceof Error ? error.message : "Erro inesperado"
              }
              onRetry={() => void refresh()}
            />
          </Box>
        ) : (
          <CustomerCategoryListTable
            categories={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </ListPagePanel>

      <CustomerCategoryFormDialog
        open={dialog.open}
        onOpenChange={handleDialogOpenChange}
        mode={dialog.mode}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        onSave={handleSave}
      />
    </ListPageShell>
  );
}
