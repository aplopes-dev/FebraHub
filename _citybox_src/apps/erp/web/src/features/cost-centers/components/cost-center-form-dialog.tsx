"use client";

import { useState } from "react";
import Typography from "@mui/material/Typography";
import FormLabel from "@mui/material/FormLabel";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
} from "@citybox/mui";
import type { CostCenterFormValues } from "@/features/cost-centers/types/cost-center";

type CostCenterFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: CostCenterFormValues;
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CostCenterFormValues) => void;
  isSaving?: boolean;
};

export function CostCenterFormDialog({
  open,
  mode,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
  isSaving = false,
}: CostCenterFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <CostCenterFormDialogBody
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        onOpenChange={onOpenChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function CostCenterFormDialogBody({
  mode,
  initialValues,
  onOpenChange,
  onSave,
  isSaving,
}: {
  mode: "create" | "edit";
  initialValues: CostCenterFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CostCenterFormValues) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialValues.name);

  return (
    <>
      <DialogTitle>
        {mode === "create" ? "Novo centro de custo" : "Editar centro de custo"}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 3 }}
        >
          {mode === "create"
            ? "Cadastre um centro de custo para organizar os lançamentos financeiros da sua empresa."
            : "Altere o nome do centro de custo."}
        </Typography>
        <FormLabel htmlFor="cost-center-name" sx={{ mb: 1, display: "block" }}>
          Nome
        </FormLabel>
        <Input
          id="cost-center-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Administrativo, Marketing, TI…"
          autoFocus
          fullWidth
          disabled={isSaving}
        />
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!name.trim() || isSaving}
          loading={isSaving}
          onClick={() => onSave({ name: name.trim() })}
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
