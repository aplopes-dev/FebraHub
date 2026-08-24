"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
  Switch,
} from "@citybox/mui";
import { SelectField } from "@/components/ui/form";
import {
  KDS_STATUS_LABELS,
  type KdsFormValues,
  type KdsStatus,
} from "@/features/kds/types/kds";

const STATUS_OPTIONS = (Object.keys(KDS_STATUS_LABELS) as KdsStatus[]).map(
  (value) => ({ value, label: KDS_STATUS_LABELS[value] }),
);

const fieldGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 2.5,
  mt: 1,
} as const;

type KdsFormDialogProps = {
  open: boolean;
  /** `undefined` = criação. */
  title: string;
  initialValues: KdsFormValues;
  /** Remonta o corpo do dialog a cada abertura (limpa o estado do form). */
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: KdsFormValues) => void;
};

export function KdsFormDialog({
  open,
  title,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
}: KdsFormDialogProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <KdsFormDialogBody
        key={formKey}
        title={title}
        initialValues={initialValues}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    </Dialog>
  );
}

function KdsFormDialogBody({
  title,
  initialValues,
  onOpenChange,
  onSave,
}: {
  title: string;
  initialValues: KdsFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: KdsFormValues) => void;
}) {
  const [name, setName] = useState(initialValues.name);
  const [status, setStatus] = useState<KdsStatus>(initialValues.status);
  const [isExpedition, setIsExpedition] = useState(initialValues.isExpedition);

  const canSave = name.trim().length >= 2;

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          A tela de KDS mostra os pedidos em preparo para a equipe da cozinha ou
          do bar.
        </Typography>

        <Box sx={fieldGridSx}>
          <FormField
            id="kds-name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Cozinha quente"
            autoFocus
            required
          />

          <SelectField
            id="kds-status"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as KdsStatus)}
            options={STATUS_OPTIONS}
          />
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isExpedition}
                onChange={(event) => setIsExpedition(event.target.checked)}
              />
            }
            label="Tela de expedição"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            Além de preparar, esta tela confere o pedido montado e libera para
            entrega ou retirada.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSave}
          onClick={() => onSave({ name, status, isExpedition })}
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
