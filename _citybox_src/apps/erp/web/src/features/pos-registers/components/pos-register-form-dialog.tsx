"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
} from "@citybox/mui";
import { TerminalModulesSection } from "@/features/pos-modules/components/terminal-modules-section";
import { PosRegisterSelectField } from "@/features/pos-registers/components/pos-register-select-field";
import {
  POS_OFFLINE_SERVER_OPTIONS,
  POS_PRINTER_OPTIONS,
  POS_SCALE_OPTIONS,
} from "@/features/pos-registers/data/pos-register-options";
import {
  NFCE_CONTINGENCY_LABELS,
  POS_REGISTER_STATUS_LABELS,
  type NfceContingency,
  type PosRegisterFormValues,
  type PosRegisterStatus,
} from "@/features/pos-registers/types/pos-register";

const STATUS_OPTIONS = (
  Object.keys(POS_REGISTER_STATUS_LABELS) as PosRegisterStatus[]
).map((id) => ({ id, label: POS_REGISTER_STATUS_LABELS[id] }));

const NFCE_OPTIONS = (
  Object.keys(NFCE_CONTINGENCY_LABELS) as NfceContingency[]
).map((id) => ({ id, label: NFCE_CONTINGENCY_LABELS[id] }));

const fieldGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 2.5,
  mt: 1,
} as const;

type PosRegisterFormDialogProps = {
  open: boolean;
  title?: string;
  initialValues: PosRegisterFormValues;
  formKey: string;
  isSaving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PosRegisterFormValues) => void;
};

export function PosRegisterFormDialog({
  open,
  title = "Novo PDV",
  initialValues,
  formKey,
  isSaving = false,
  onOpenChange,
  onSave,
}: PosRegisterFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
    >
      <PosRegisterFormDialogBody
        key={formKey}
        title={title}
        initialValues={initialValues}
        isSaving={isSaving}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    </Dialog>
  );
}

function PosRegisterFormDialogBody({
  title,
  initialValues,
  isSaving,
  onOpenChange,
  onSave,
}: {
  title: string;
  initialValues: PosRegisterFormValues;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PosRegisterFormValues) => void;
}) {
  const [name, setName] = useState(initialValues.name);
  const [status, setStatus] = useState<PosRegisterStatus>(
    initialValues.status,
  );
  const [nfceContingency, setNfceContingency] = useState<NfceContingency>(
    initialValues.nfceContingency,
  );
  const [printerId, setPrinterId] = useState(initialValues.printerId);
  const [scaleId, setScaleId] = useState(initialValues.scaleId);
  const [offlineServerId, setOfflineServerId] = useState(
    initialValues.offlineServerId,
  );
  const [moduleOverrides, setModuleOverrides] = useState<
    Record<string, string> | null
  >(initialValues.moduleOverrides);

  const canSave = name.trim().length >= 2;

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Cadastre um ponto de venda com os equipamentos e o servidor offline.
        </Typography>

        <Box sx={fieldGridSx}>
          <FormField
            id="pos-register-name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Caixa 1 — Balcão"
            autoFocus
          />

          <PosRegisterSelectField
            id="pos-register-status"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as PosRegisterStatus)}
            options={STATUS_OPTIONS}
          />

          <PosRegisterSelectField
            id="pos-register-nfce"
            label="NFC-e em contingência"
            value={nfceContingency}
            onChange={(value) => setNfceContingency(value as NfceContingency)}
            options={NFCE_OPTIONS}
          />

          <PosRegisterSelectField
            id="pos-register-printer"
            label="Ponto de impressão"
            value={printerId}
            onChange={setPrinterId}
            options={POS_PRINTER_OPTIONS}
            emptyOptionLabel="Nenhum"
          />

          <PosRegisterSelectField
            id="pos-register-scale"
            label="Balança"
            value={scaleId}
            onChange={setScaleId}
            options={POS_SCALE_OPTIONS}
            emptyOptionLabel="Nenhuma"
          />

          <PosRegisterSelectField
            id="pos-register-offline"
            label="Aplicativo offline"
            value={offlineServerId}
            onChange={setOfflineServerId}
            options={POS_OFFLINE_SERVER_OPTIONS}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Módulos
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            Quais telas este PDV mostra. Um restaurante com balcão de retirada
            pode ligar Mesas no salão e desligar aqui.
          </Typography>
          <TerminalModulesSection
            overrides={moduleOverrides}
            onChange={setModuleOverrides}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          disabled={isSaving}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSave}
          loading={isSaving}
          onClick={() =>
            onSave({
              name: name.trim(),
              moduleOverrides,
              status,
              nfceContingency,
              printerId,
              scaleId,
              offlineServerId,
            })
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
