"use client";

import { Button, Drawer, Stack } from "@/ui";
import { UnitOfMeasureForm } from "@/features/unit-of-measure/components/unit-of-measure-form";
import type { UnitOfMeasureFormValues } from "@/features/unit-of-measure/types/unit-of-measure";

const FORM_ID = "unit-of-measure-form";

type UnitOfMeasureFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: UnitOfMeasureFormValues;
  formKey: string;
  onSave: (values: UnitOfMeasureFormValues) => void;
  isSaving?: boolean;
};

export function UnitOfMeasureFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
}: UnitOfMeasureFormDrawerProps) {
  const title =
    mode === "create" ? "Nova unidade" : "Editar unidade de medida";

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
      <UnitOfMeasureForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
      />
    </Drawer>
  );
}
