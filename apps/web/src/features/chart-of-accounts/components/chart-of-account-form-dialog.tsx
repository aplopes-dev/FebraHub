"use client";

import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FormLabel from "@mui/material/FormLabel";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Input,
  Select,
} from "@/ui";
import { useFinancialGroupOptionsQuery } from "@/features/financial-groups/hooks/use-financial-group-queries";
import { FINANCIAL_GROUP_TYPE_LABELS } from "@/features/financial-groups/types/financial-group";
import type { ChartOfAccountFormValues } from "@/features/chart-of-accounts/types/chart-of-account";

type ChartOfAccountFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: ChartOfAccountFormValues;
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ChartOfAccountFormValues) => void;
  isSaving?: boolean;
};

export function ChartOfAccountFormDialog({
  open,
  mode,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
  isSaving = false,
}: ChartOfAccountFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <ChartOfAccountFormDialogBody
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

function ChartOfAccountFormDialogBody({
  mode,
  initialValues,
  onOpenChange,
  onSave,
  isSaving,
}: {
  mode: "create" | "edit";
  initialValues: ChartOfAccountFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ChartOfAccountFormValues) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialValues.name);
  const [financialGroupId, setFinancialGroupId] = useState(
    initialValues.financialGroupId,
  );
  const [availableForPdv, setAvailableForPdv] = useState(
    initialValues.availableForPdv,
  );

  const groupsQuery = useFinancialGroupOptionsQuery();
  const groups = groupsQuery.data ?? [];

  const canSave = name.trim().length >= 2 && Boolean(financialGroupId);

  return (
    <>
      <DialogTitle>
        {mode === "create" ? "Novo plano de contas" : "Editar plano de contas"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {mode === "create"
            ? "Cadastre uma conta vinculada a um grupo financeiro."
            : "Altere os dados da conta do plano de contas."}
        </Typography>

        <Input
          id="chart-of-account-name"
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Vendas no balcão…"
          autoFocus
          fullWidth
          disabled={isSaving}
          sx={{ mb: 3 }}
        />

        <FormControl fullWidth sx={{ mb: 3 }} disabled={isSaving}>
          <FormLabel
            sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 0.5 }}
          >
            Grupo financeiro
          </FormLabel>
          <Select
            value={financialGroupId}
            displayEmpty
            onChange={(event) =>
              setFinancialGroupId(event.target.value as string)
            }
          >
            <MenuItem value="" disabled>
              Selecione o grupo
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name} ({FINANCIAL_GROUP_TYPE_LABELS[group.type]})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={availableForPdv}
              disabled={isSaving}
              onChange={(event) => setAvailableForPdv(event.target.checked)}
            />
          }
          label="Disponível para PDV"
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
          disabled={!canSave || isSaving}
          loading={isSaving}
          onClick={() =>
            onSave({
              name: name.trim(),
              financialGroupId,
              availableForPdv,
            })
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
