"use client";

import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Input,
  Radio,
  RadioGroup,
} from "@/ui";
import {
  FINANCIAL_GROUP_TYPE_LABELS,
  type FinancialGroupFormValues,
  type FinancialGroupType,
} from "@/features/financial-groups/types/financial-group";

type FinancialGroupFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: FinancialGroupFormValues;
  formKey: string;
  /** Grupos de sistema: o tipo (receita/despesa) não pode mudar. */
  typeLocked?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FinancialGroupFormValues) => void;
  isSaving?: boolean;
};

export function FinancialGroupFormDialog({
  open,
  mode,
  initialValues,
  formKey,
  typeLocked = false,
  onOpenChange,
  onSave,
  isSaving = false,
}: FinancialGroupFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <FinancialGroupFormDialogBody
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        typeLocked={typeLocked}
        onOpenChange={onOpenChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function FinancialGroupFormDialogBody({
  mode,
  initialValues,
  typeLocked,
  onOpenChange,
  onSave,
  isSaving,
}: {
  mode: "create" | "edit";
  initialValues: FinancialGroupFormValues;
  typeLocked: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FinancialGroupFormValues) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialValues.name);
  const [type, setType] = useState<FinancialGroupType>(initialValues.type);

  return (
    <>
      <DialogTitle>
        {mode === "create" ? "Novo grupo financeiro" : "Editar grupo financeiro"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {mode === "create"
            ? "Agrupe contas do plano de contas por natureza (receita ou despesa)."
            : typeLocked
              ? "Altere o nome do grupo. O tipo é de sistema e não pode ser modificado."
              : "Altere o nome ou o tipo do grupo financeiro."}
        </Typography>

        <Input
          id="financial-group-name"
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Vendas, Despesas operacionais…"
          autoFocus
          fullWidth
          disabled={isSaving}
          sx={{ mb: 3 }}
        />

        <FormControl component="fieldset" disabled={isSaving || typeLocked}>
          <FormLabel
            component="legend"
            sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
          >
            Tipo
          </FormLabel>
          <RadioGroup
            value={type}
            onChange={(event) =>
              setType(event.target.value as FinancialGroupType)
            }
            row
          >
            {(Object.keys(FINANCIAL_GROUP_TYPE_LABELS) as FinancialGroupType[]).map(
              (key) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={<Radio size="small" />}
                  label={FINANCIAL_GROUP_TYPE_LABELS[key]}
                />
              ),
            )}
          </RadioGroup>
        </FormControl>
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
          onClick={() => onSave({ name: name.trim(), type })}
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
