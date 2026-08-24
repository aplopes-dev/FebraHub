"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, ConfirmationDialog, Input, PasswordInput, toast } from "@citybox/mui";
import { SemanticBadge } from "@/components/ui/status";
import { FormSection } from "@/components/ui/form";
import { useUnsavedChangesGuard } from "../lib/unsaved-guard";
import type { SetCscPayload } from "../api/fiscal-settings.dto";

type CscSectionProps = {
  configured: boolean;
  isSaving: boolean;
  onSave: (payload: SetCscPayload) => Promise<boolean>;
  /** spec erp/024, Parte B — só existe (e só é oferecido na UI) quando `configured === true`. */
  isRemoving: boolean;
  onRemove: () => Promise<void>;
};

/**
 * Bloco "Autenticação e QR Code" (CSC da NFC-e). Write-only: mostra só
 * configurado/não-configurado; o token vive no estado local e some após salvar,
 * nunca é exibido de volta (spec erp/012, FR-004/FR-005).
 */
export function CscSection({
  configured,
  isSaving,
  onSave,
  isRemoving,
  onRemove,
}: CscSectionProps) {
  const [editing, setEditing] = useState(false);
  const [cscId, setCscId] = useState("");
  const [cscToken, setCscToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // Editar o CSC (ID/token digitados) conta como alteração não salva (SC-005).
  const cscDirty = editing && (cscId.trim().length > 0 || cscToken.length > 0);
  useUnsavedChangesGuard("csc", cscDirty);

  function reset() {
    setCscId("");
    setCscToken("");
    setLocalError(null);
    setEditing(false);
  }

  async function handleSave() {
    if (!/^\d{1,6}$/.test(cscId.trim())) {
      setLocalError("O ID do CSC deve ter de 1 a 6 dígitos.");
      return;
    }
    if (!cscToken.trim()) {
      setLocalError("Informe o token do CSC.");
      return;
    }
    setLocalError(null);
    const ok = await onSave({ cscId: cscId.trim(), cscToken });
    if (ok) {
      reset();
      toast.success("CSC configurado.");
    } else {
      // Descarta o token após o envio mesmo em falha (FR-004): o segredo não
      // fica retido; o ID permanece para o usuário reenviar sem reabrir tudo.
      setCscToken("");
    }
  }

  return (
    <FormSection
      title="Autenticação e QR Code (CSC)"
      description="Código de Segurança do Contribuinte usado no QR Code da NFC-e. O token é secreto e nunca é exibido de volta."
    >
      <Stack spacing={2}>
        <Box>
          {configured ? (
            <SemanticBadge label="CSC configurado" tone="success" />
          ) : (
            <SemanticBadge label="CSC não configurado" tone="neutral" />
          )}
        </Box>

        {editing ? (
          <Stack
            component="form"
            spacing={2}
            sx={{ maxWidth: 480 }}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <Input
              label="ID do CSC"
              value={cscId}
              onChange={(event) => setCscId(event.target.value)}
              fullWidth
              disabled={isSaving}
              inputMode="numeric"
              helperText="Como aparece no portal da SEFAZ (ex.: 000001)."
            />
            <PasswordInput
              label="Token do CSC"
              value={cscToken}
              onChange={(event) => setCscToken(event.target.value)}
              autoComplete="new-password"
              fullWidth
              disabled={isSaving}
            />
            {localError ? <Alert severity="error">{localError}</Alert> : null}
            <Stack direction="row" spacing={1}>
              <Button type="submit" loading={isSaving}>
                Salvar CSC
              </Button>
              <Button variant="text" onClick={reset} disabled={isSaving}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setEditing(true)}>
                {configured ? "Substituir CSC" : "Configurar CSC"}
              </Button>
              {/* Só oferecida quando há CSC — nunca mostrar remover sem nada pra remover (FR-012). */}
              {configured ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmRemoveOpen(true)}
                >
                  Remover CSC
                </Button>
              ) : null}
            </Stack>
            {configured ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Substituir troca o par ID + token por inteiro. Remover volta o
                Emitente a &quot;CSC não configurado&quot;.
              </Typography>
            ) : null}
          </Box>
        )}
      </Stack>

      <ConfirmationDialog
        open={confirmRemoveOpen}
        onCancel={() => {
          if (!isRemoving) setConfirmRemoveOpen(false);
        }}
        title="Remover CSC?"
        description="O Emitente volta a ficar sem CSC configurado. Se o PDV estiver emitindo NFC-e (Modelo 65), a remoção é bloqueada até você trocar o modelo."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        confirmColor="error"
        loading={isRemoving}
        onConfirm={async () => {
          await onRemove();
          setConfirmRemoveOpen(false);
        }}
      />
    </FormSection>
  );
}
