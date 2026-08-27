"use client";

import Stack from "@mui/material/Stack";
import { Button, Drawer } from "@/ui";
import { VariationForm } from "@/features/variations/components/variation-form";
import type { VariationFormValues } from "@/features/variations/types/variation";

const FORM_ID = "variation-form";

type VariationFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: VariationFormValues;
  formKey: string;
  onSave: (values: VariationFormValues) => void;
  isSaving?: boolean;
};

export function VariationFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
}: VariationFormDrawerProps) {
  const title = mode === "create" ? "Nova variação" : "Editar variação";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width={720}
      footer={
        <Stack direction="row" spacing={1} sx={{
          justifyContent: "flex-end"
        }}>
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
      <VariationForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
      />
    </Drawer>
  );
}
