"use client";

import { Button, Drawer, Stack } from "@/ui";
import { MovementCategoryForm } from "@/features/movement-categories/components/movement-category-form";
import type { MovementCategoryFormValues } from "@/features/movement-categories/types/movement-category";

const FORM_ID = "movement-category-form";

type MovementCategoryFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: MovementCategoryFormValues;
  formKey: string;
  onSave: (values: MovementCategoryFormValues) => void;
  isSaving?: boolean;
  /** Bloqueia alteração de type (categorias de sistema). */
  typeLocked?: boolean;
};

export function MovementCategoryFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
  typeLocked = false,
}: MovementCategoryFormDrawerProps) {
  const title =
    mode === "create"
      ? "Nova categoria de movimentação"
      : "Editar categoria de movimentação";

  return (
    <Drawer
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={title}
      width={640}
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
            loading={isSaving}
            disabled={isSaving}
          >
            Salvar
          </Button>
        </Stack>
      }
    >
      <MovementCategoryForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
        typeLocked={typeLocked}
      />
    </Drawer>
  );
}
