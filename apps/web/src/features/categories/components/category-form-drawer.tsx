"use client";

import Stack from "@mui/material/Stack";
import { Button, Drawer } from "@/ui";
import { CategoryForm } from "@/features/categories/components/category-form";
import type { CategoryFormValues } from "@/features/categories/types/category";

const FORM_ID = "category-form";

type CategoryFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: CategoryFormValues;
  formKey: string;
  onSave: (values: CategoryFormValues) => void;
  isSaving?: boolean;
};

export function CategoryFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
}: CategoryFormDrawerProps) {
  const title = mode === "create" ? "Nova categoria" : "Editar categoria";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </Stack>
      }
    >
      <CategoryForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
      />
    </Drawer>
  );
}

