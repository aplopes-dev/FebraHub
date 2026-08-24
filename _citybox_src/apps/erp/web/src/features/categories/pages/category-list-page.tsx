"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { CategoryFormDrawer } from "@/features/categories/components/category-form-drawer";
import { CategoryListTable } from "@/features/categories/components/category-list-table";
import {
  createEmptyCategoryFormValues,
  categoryToFormValues,
} from "@/features/categories/api/categories.service";
import { useCategoryList } from "@/features/categories/hooks/use-category-list";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/features/categories/hooks/use-category-mutations";
import type {
  CategoryFormValues,
  CategoryListItem,
} from "@/features/categories/types/category";

type DrawerState = {
  open: boolean;
  mode: "create" | "edit";
  categoryId?: string;
  initialValues: CategoryFormValues;
  formKey: string;
};

export function CategoryListPage() {
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
  } = useCategoryList();

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const [drawer, setDrawer] = useState<DrawerState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyCategoryFormValues(),
    formKey: "closed",
  }));

  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setDrawer({
      open: true,
      mode: "create",
      initialValues: createEmptyCategoryFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(category: CategoryListItem) {
    setDrawer({
      open: true,
      mode: "edit",
      categoryId: category.id,
      initialValues: categoryToFormValues(category),
      formKey: `edit-${category.id}-${Date.now()}`,
    });
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open && !isSaving) setDrawer((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: CategoryFormValues) {
    if (!drawer.open) return;

    const payload = {
      name: values.name.trim(),
      active: values.active,
    };

    if (!payload.name) return;

    if (drawer.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })),
      });
      return;
    }

    if (drawer.categoryId) {
      updateMutation.mutate(
        { id: drawer.categoryId, payload },
        { onSuccess: () => setDrawer((prev) => ({ ...prev, open: false })) },
      );
    }
  }

  function handleDelete(category: CategoryListItem) {
    deleteMutation.mutate(category.id);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Categorias"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              value={search}
              size="small"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar categorias…"
              sx={{ width: { xs: 224, sm: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              onClick={openCreate}
              startIcon={<AddIcon />}
            >
              Nova categoria
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
            <AlertTitle>Não foi possível carregar as categorias</AlertTitle>
            {error instanceof Error ? error.message : "Erro inesperado"}
          </Alert>
        ) : (
          <CategoryListTable
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

      <CategoryFormDrawer
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
