"use client";

import { Button, Drawer, Stack } from "@/ui";
import { PriceListForm } from "@/features/price-lists/components/price-list-form";
import type { PriceListFormValues } from "@/features/price-lists/types/price-list";

const FORM_ID = "price-list-form";

type PriceListFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues: PriceListFormValues;
  formKey: string;
  onSave: (values: PriceListFormValues) => void;
  isSaving?: boolean;
};

export function PriceListFormDrawer({
  open,
  onClose,
  mode,
  initialValues,
  formKey,
  onSave,
  isSaving = false,
}: PriceListFormDrawerProps) {
  const title =
    mode === "create" ? "Nova lista de preços" : "Editar lista de preços";

  return (
    <Drawer
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={title}
      width={520}
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
      <PriceListForm
        key={formKey}
        formId={FORM_ID}
        initialValues={initialValues}
        onSubmit={onSave}
      />
    </Drawer>
  );
}
