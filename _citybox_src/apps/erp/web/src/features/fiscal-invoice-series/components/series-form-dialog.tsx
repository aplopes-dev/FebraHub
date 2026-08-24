"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
} from "@citybox/mui";
import { SelectField } from "@/components/ui/form";
import { DOCUMENT_TYPE_OPTIONS } from "../lib/labels";
import type {
  CreateFiscalSequencePayload,
  FiscalDocumentType,
  FiscalEnvironment,
} from "../api/fiscal-sequence.dto";

type SeriesFormDialogProps = {
  open: boolean;
  environment: FiscalEnvironment;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateFiscalSequencePayload) => void;
};

/** Formulário "Nova série" (spec erp/011, US1). Cria no ambiente ativo do filtro. */
export function SeriesFormDialog({
  open,
  environment,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: SeriesFormDialogProps) {
  const [documentType, setDocumentType] = useState<FiscalDocumentType>("NFE");
  const [series, setSeries] = useState("001");
  const [initialNumber, setInitialNumber] = useState("0");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit() {
    if (!/^[0-9]{1,3}$/.test(series.trim())) {
      setLocalError("Série inválida: informe de 1 a 3 dígitos (ex.: 001).");
      return;
    }
    const parsed = Number(initialNumber);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setLocalError("Número atual inicial deve ser um inteiro ≥ 0.");
      return;
    }
    setLocalError(null);
    onSubmit({
      documentType,
      series: series.trim(),
      initialNumber: parsed,
      environment,
    });
  }

  const shownError = localError ?? errorMessage;

  return (
    <Dialog
      open={open}
      onClose={() => !isSaving && onClose()}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Nova série</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <SelectField
            id="series-document-type"
            label="Série para venda de"
            value={documentType}
            onChange={(value) => setDocumentType(value as FiscalDocumentType)}
            options={DOCUMENT_TYPE_OPTIONS}
            disabled={isSaving}
          />
          <Input
            label="Série"
            value={series}
            onChange={(event) => setSeries(event.target.value)}
            fullWidth
            disabled={isSaving}
            helperText="1 a 3 dígitos (ex.: 001)."
          />
          <Input
            label="Número atual"
            value={initialNumber}
            onChange={(event) => setInitialNumber(event.target.value)}
            fullWidth
            disabled={isSaving}
            inputMode="numeric"
            helperText="Use um valor maior que zero apenas ao migrar de outro emissor."
          />
          {shownError ? <Alert severity="error">{shownError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={isSaving}>
          Adicionar série
        </Button>
      </DialogActions>
    </Dialog>
  );
}
