"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
} from "@citybox/mui";

type EditNumberDialogProps = {
  open: boolean;
  seriesLabel: string;
  currentNumber: string;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (newNumber: number) => void;
};

/**
 * Ajuste do número atual (spec erp/011, US2). Só aumento; este diálogo É o passo
 * de confirmação explícita. Reduzir é bloqueado com mensagem (client + API).
 */
export function EditNumberDialog({
  open,
  seriesLabel,
  currentNumber,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: EditNumberDialogProps) {
  const [value, setValue] = useState(currentNumber);
  const [localError, setLocalError] = useState<string | null>(null);

  const current = Number(currentNumber);

  function handleSubmit() {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      setLocalError("Informe um número inteiro válido.");
      return;
    }
    if (next < current) {
      setLocalError(
        "Não é possível reduzir o número atual: reduzir reemitiria uma faixa de numeração já autorizada, o que a SEFAZ rejeita. O número só pode ser aumentado.",
      );
      return;
    }
    setLocalError(null);
    onSubmit(next);
  }

  const shownError = localError ?? errorMessage;

  return (
    <Dialog
      open={open}
      onClose={() => !isSaving && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Ajustar número — série {seriesLabel}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Número atual: <strong>{currentNumber}</strong>. O número só pode ser
            aumentado. A alteração fica registrada (quem alterou e quando).
          </Typography>
          <Input
            label="Novo número atual"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            fullWidth
            disabled={isSaving}
            inputMode="numeric"
          />
          {shownError ? <Alert severity="error">{shownError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={isSaving}>
          Confirmar aumento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
