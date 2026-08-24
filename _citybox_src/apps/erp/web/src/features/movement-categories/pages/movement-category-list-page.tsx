"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "@citybox/mui";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import {
  ListLoadErrorAlert,
  ListPageShell,
} from "@/components/ui/list-page";
import { MovementCategoryFormDrawer } from "@/features/movement-categories/components/movement-category-form-drawer";
import { MovementCategoryListTable } from "@/features/movement-categories/components/movement-category-list-table";
import { MovementCategoryListToolbar } from "@/features/movement-categories/components/movement-category-list-toolbar";
import {
  createEmptyMovementCategoryFormValues,
  movementCategoryToFormValues,
  toSaveMovementCategoryPayload,
} from "@/features/movement-categories/api/movement-category.mapper";
import { useMovementCategoryList } from "@/features/movement-categories/hooks/use-movement-category-list";
import {
  useCreateMovementCategoryMutation,
  useDeleteMovementCategoryMutation,
  useUpdateMovementCategoryMutation,
} from "@/features/movement-categories/hooks/use-movement-category-mutations";
import { validateMovementCategoryForm } from "@/features/movement-categories/lib/validate-movement-category-form";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import {
  canRemoveMovementCategory,
  type MovementCategoryFormValues,
  type MovementCategoryListItem,
} from "@/features/movement-categories/types/movement-category";

type DrawerState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      categoryId?: string;
      isSystem?: boolean;
      initialValues: MovementCategoryFormValues;
      formKey: string;
    };

export function MovementCategoryListPage() {
  const {
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
  } = useMovementCategoryList();

  const units = useBranchUnits();
  const createMutation = useCreateMovementCategoryMutation();
  const updateMutation = useUpdateMovementCategoryMutation();
  const deleteMutation = useDeleteMovementCategoryMutation();

  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyMovementCategoryFormValues(
        units.map((unit) => unit.id),
      ),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(category: MovementCategoryListItem) {
    setDrawer({
      open: true,
      mode: "edit",
      categoryId: category.id,
      isSystem: category.isSystem,
      initialValues: movementCategoryToFormValues(category),
      formKey: `edit-${category.id}-${Date.now()}`,
    });
  }

  function handleDrawerClose() {
    if (isSaving) return;
    setDrawer({ open: false });
  }

  async function handleSave(values: MovementCategoryFormValues) {
    if (!drawer.open) return;

    const validationError = validateMovementCategoryForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = toSaveMovementCategoryPayload(values);

    if (drawer.mode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (drawer.categoryId) {
      await updateMutation.mutateAsync({ id: drawer.categoryId, payload });
    }

    setDrawer({ open: false });
  }

  async function handleDelete(category: MovementCategoryListItem) {
    const removability = canRemoveMovementCategory(category);
    if (!removability.removable) {
      toast.error(
        removability.reason ?? "Esta categoria não pode ser excluída.",
      );
      return;
    }
    await deleteMutation.mutateAsync(category.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Categorias de movimentação"
        actions={
          <Button
            type="button"
            variant="contained"
            onClick={openCreate}
            startIcon={<AddIcon />}
          >
            Nova categoria
          </Button>
        }
      />

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <MovementCategoryListToolbar
            search={search}
            onSearchChange={setSearch}
            type={type}
            onTypeChange={setType}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar as categorias"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={refresh}
          />
        ) : (
          <MovementCategoryListTable
            categories={result.data}
            pageIndex={result.meta.page - 1}
            totalRowCount={result.meta.total}
            pageSize={perPage}
            isFetching={isFetching}
            onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </ListPagePanel>

      {drawer.open ? (
        <MovementCategoryFormDrawer
          open={drawer.open}
          onClose={handleDrawerClose}
          mode={drawer.mode}
          initialValues={drawer.initialValues}
          formKey={drawer.formKey}
          onSave={handleSave}
          isSaving={isSaving}
          typeLocked={Boolean(drawer.isSystem)}
        />
      ) : null}
    </ListPageShell>
  );
}
