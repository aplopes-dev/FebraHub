"use client";

import Stack from "@mui/material/Stack";
import { Button, Drawer } from "@/ui";
import { VehicleModelForm } from "@/features/vehicle-models/components/vehicle-model-form";
import type { VehicleModelFormValues } from "@/features/vehicle-models/types/vehicle-model";

const FORM_ID = "vehicle-model-form";

type VehicleModelFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: VehicleModelFormValues;
  formKey: string;
  onSave: (values: VehicleModelFormValues) => void;
  isSaving?: boolean;
};

export function VehicleModelFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
}: VehicleModelFormDrawerProps) {
  const title = mode === "create" ? "Novo modelo" : "Editar modelo";

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
      <VehicleModelForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
      />
    </Drawer>
  );
}
